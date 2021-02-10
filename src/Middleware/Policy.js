'use strict'

const { resolver } = require('@adonisjs/fold')
const debug = use('debug')('policy:PolicyMiddleware')

const { validateAll } = use('@jayrchamp/Policy/Validator')

const _ = require('lodash')
const deepDiff = require("../utils/deepDiff");
const matchObjectToArray = require("../utils/matchObjectToArray");

const CE = require('../Exceptions')


/**
 * PolicyMiddleware
 *
 * @class PolicyMiddleware
 * @constructor
 */
class PolicyMiddleware {
  /**
   * Calls the policy authorize method when it exists
   *
   * @method _authorize
   *
   * @param  {Object}   policyInstance
   *
   * @return {Boolean}
   *
   * @private
   */
  _authorize (policyInstance) {
    debug('_authorize')
    if (typeof (policyInstance.authorize) !== 'function') {
      return true
    }
    return policyInstance.authorize()
  }

  /**
   * Calls the policy permittedFields method when it exists
   *
   * @method _permittedFields
   *
   * @param  {Object}   policyInstance
   *
   * @return {boolean|array} - Returns true or an array of flat properties (ex.: ['flat.property', 'flat.property2'] )
   *
   * @private
   */
  async _permittedFields (policyInstance) {
    if (typeof (policyInstance.permittedFields) !== 'function') {
      return true
    }

    const permittedFields = await policyInstance.permittedFields()

    if ((Array.isArray(permittedFields) && permittedFields.length <= 0) || !permittedFields) {
      return []
    }

    return permittedFields
  }

  /**
   *
   * @method _runPermittedFieldsFiltering
   *
   * @param {Object} policyInstance
   * @param {object} ctx
   *
   * @return {void}
   *
   * @private
   */
  async _runPermittedFieldsFiltering (policyInstance, ctx) {
    const permittedFields = await this._permittedFields(policyInstance)
    debug('permittedFields', permittedFields)
    if (typeof permittedFields === 'boolean' && permittedFields) return
    ctx.response.lazyBody.content = await this._filterContentFields(permittedFields, ctx.response.lazyBody.content)
  }

  /**
   * Calls the policy permittedQuery method when it exists
   *
   * No method declared in policy class means that all query
   * fields are allowed.
   *
   * @method _permittedQuery
   *
   * @param  {Object}   policyInstance
   *
   * @return {array}
   *
   * @private
   */
  async _permittedQuery (policyInstance, ctx) {
    if (typeof (policyInstance.permittedQuery) !== 'function') {
      return null
    }

    const permittedQuery = await policyInstance.permittedQuery()

    if ((Array.isArray(permittedQuery) && permittedQuery.length <= 0) || !permittedQuery) {
      return []
    }
    return permittedQuery
  }

  /**
   * Whitelisting only the fields from Request.all() that match
   * the rules returned by policy.permittedQuery and nothing else.
   *
   * @method _verifyPermittedQueryFields
   *
   * @param {*} permittedQuery
   * @param {*} data
   *
   * @return {void}
   *
   * @private
   */
  async _verifyPermittedQueryFields (permittedQuery, data) {
    if (permittedQuery !== null) {
      const whitelistedFields = Object.keys(permittedQuery)
      const authorizedData = matchObjectToArray(data, whitelistedFields)
      const dataHasUnauthorizedFields = !_.isEqual(authorizedData, data)
      if (dataHasUnauthorizedFields) {
        const notAuthorizedData = deepDiff(authorizedData, data)
        const notAuthorizedDataFields = Object.keys(notAuthorizedData)
        const messages = notAuthorizedDataFields.map(field => {
          return {
            field: field,
            message: `Not authorized on query field ${field}.`,
          }
        })
        throw CE.PolicyValidationException.failed(messages,
          'Not authorized on query fields.', 403, 'E_PERMITTED_QUERY_FIELDS'
        )
      }
    }
  }

  /**
   *
   * @method _verifyPermittedQueryFieldsValue
   *
   * @param {*} permittedQuery
   * @param {*} data
   *
   * @return {void}
   *
   * @private
   */
  async _verifyPermittedQueryFieldsValue (permittedQuery, data) {
    if (permittedQuery !== null) {
      let validation = await validateAll(data, permittedQuery)
      if (validation.fails()) {
        throw CE.PolicyValidationException.failed(validation.messages(),
          'Not authorized on query fields values.', 403, 'E_PERMITTED_QUERY_FIELDS_VALUES'
        )
      }
    }
  }

  /**
   * @method _runPermittedQueryAuthorization
   *
   * @param {object} ctx
   *
   * @return {void}
   *
   * @private
   */
  async _runPermittedQueryAuthorization (policyInstance, ctx) {
    const data = ctx.request.all()
    const permittedQuery = await this._permittedQuery(policyInstance, ctx)

    /**
     * Verifies that end-user is allowed to use fields in body/query of request
     */
    await this._verifyPermittedQueryFields(permittedQuery, data)

    /**
     * Verifies that end-user is allowed to use value within fields in body/query of request
     */
    await this._verifyPermittedQueryFieldsValue(permittedQuery, data)
  }

  /**
   * Filters the response content to to keep only
   * the permitted fields
   *
   * @method _filterContentFields
   *
   * @param  {array}  fields - An array of fields that is allowed to keep on the response content
   * @param  {Object}  content - Response content in its Object format
   *
   * @return {object} - Response content in its JSON format
   *
   * @private
   */
  _filterContentFields (permittedFields, content) {
    if (!content) {
      return null
    }

    if (content && typeof content.toJSON === 'function') {
      content = content.toJSON()
    }

    if (content && content.data) {
      const { data, ...rest } = content
      return { ...rest, data: content.data.map(c => matchObjectToArray(c, permittedFields)) }
    } else {
      return matchObjectToArray(content, permittedFields)
    }
  }

  /**
   * Ends the response when it's pending and the end-user
   * has not made any response so far.
   *
   * @method _endResponseIfCan
   *
   * @param  {Object}          response
   * @param  {String}          message
   * @param  {Number}          status
   *
   * @return {void}
   *
   * @private
   */
  _endResponseIfCan (response, message, status) {
    if ((!response.lazyBody.content || !response.lazyBody.method) && response.isPending) {
      return response.status(status).send(message)
    }
  }

  /**
   * Handle method executed by adonis middleware chain
   *
   * @method handle
   *
   * @param  {Object}   ctx
   * @param  {Function} next
   * @param  {Array}   policy
   *
   * @return {void}
   */
  async handle (ctx, next, policy) {
    policy = policy instanceof Array === true ? policy[0] : policy

    if (!policy) {
      throw new Error('Cannot validate request without a policy. Make sure to call Route.policy(\'policyPath\')')
    }

    /**
     * Set request ctx on the policy instance
     */
    const policyInstance = resolver.forDir('policies').resolve(policy)
    debug( 'handle policyInstance', policyInstance )
    policyInstance.ctx = ctx

    /**
     * Authorize the request. This method should return true to
     * authorize the request.
     *
     * Make response or throw an exception to reject the request.
     *
     * Returning false from the method will result in a generic
     * error message
     */
    const authorized = await this._authorize(policyInstance)
    debug('authorized', authorized);
    if (!authorized) {
      this._endResponseIfCan(ctx.response, 'Unauthorized request. Make sure to handle it inside policy.authorize method', 401)
      return
    }

    /**
     * Validates that request data (request.all()) contains
     * only authorized fields and fields values.
     */
    await this._runPermittedQueryAuthorization(policyInstance, ctx)

    /**
     * Everything is okay continue to controller
     */
    await next()

    /**
     * Filters response content to return only the properties the end-user is allowed to see
     */
    await this._runPermittedFieldsFiltering(policyInstance, ctx)
  }
}

module.exports = PolicyMiddleware
