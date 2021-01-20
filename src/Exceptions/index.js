'use strict'

const GE = require('@adonisjs/generic-exceptions')

/**
 * Exception to throw when policy permitted query fails
 *
 * @class PolicyValidationException
 */
class PolicyValidationException extends GE.RuntimeException {
  static failed (messages, message = '', status = 403, code = 'E_PERMITTED_QUERY') {
    const error = new this(message, status, code)
    error.code = code
    error.message = message
    error.messages = messages
    return error
  }

  /* istanbul ignore next */
  /**
   * Handle the validation failed exception
   *
   * @method handle
   *
   * @param  {Array}  options.messages
   * @param  {Object} options.request
   * @param  {Object} options.response
   * @param  {Object} options.session
   *
   * @return {void}
   */
  async handle (error, { request, response, session }) {
    const isJSON = request.accepts(['html', 'json']) === 'json'

    /**
     * If request is json then send json response
     */
    if (isJSON) {
      return response.status(error.status).json(error)
    }

    /**
     * If session provider exists, then flash errors back to the
     * actual page
     */
    if (session && session.withErrors) {
      session.withErrors(messages).flashAll()
      await session.commit()
      response.redirect('back')
      return
    }

    /**
     * Otherwise do the dumbest thing and send a 400
     * with plain message
     */
    response
      .status(error.status)
      .send(error.message)
  }
}

module.exports = { PolicyValidationException, InvalidArgumentException: GE.InvalidArgumentException }
