'use strict'

const { ServiceProvider, resolver } = require('@adonisjs/fold')

class PolicyProvider extends ServiceProvider {

  /**
   * Registering the base policy under
   * @jayrchamp/Policy namespace
   *
   * @method _registerPolicy
   *
   * @return {void}
   *
   * @private
   */
  _registerPolicy () {
    this.app.bind('@jayrchamp/Policy', (app) => require('../src/Policy'))
  }

  /**
   * Register the query validator to the IoC container
   * with `@jayrchamp/Policy/Validator` namespace.
   *
   * @method _registerValidator
   *
   * @return {void}
   *
   * @private
   */
  _registerValidator () {
    this.app.bind('@jayrchamp/Policy/Validator', () => {
      const setValidator = require('../src/Validator')
      const Validator = setValidator({ ...require('indicative') })
      return Validator
    })
  }

  /**
   * Register the middleware to the IoC container
   * with `@jayrchamp/Middleware/Policy` namespace
   *
   * @method _registerMiddleware
   *
   * @return {void}
   *
   * @private
   */
  _registerMiddleware () {
    this.app.bind('@jayrchamp/Middleware/Policy', (app) => {
      const PolicyMiddleware = require('../src/Middleware/Policy')
      return new PolicyMiddleware()
    })
  }

  /**
   * Monkey patch Resolver to append _directories
   *
   * @method _monkeyPathResolver
   *
   * @return {void}
   *
   * @private
   */
  _monkeyPathResolver () {
    resolver._directories.policies = 'Policies'
    resolver._directories.policyTraits = 'Policies/Traits'
  }

  /**
   * Register bindings
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this._registerPolicy()
    this._monkeyPathResolver()
    this._registerValidator()
    this._registerMiddleware()
  }

  /**
   * On boot
   *
   * @method boot
   *
   * @return {void}
   */
  boot () {
    /**
     * Setup ioc resolver for internally accessing fold
     * methods.
     */
    require('../lib/iocResolver').setFold(require('@adonisjs/fold'))

    /**
     * Define a named middleware with server
     *
     * @type {String}
     */
    const Server = this.app.use('Adonis/Src/Server')
    Server.registerNamed({
      policy: '@jayrchamp/Middleware/Policy'
    })

    /**
     * Extend route class by adding a macro, which pushes a
     * middleware to the route middleware stack and
     * validates the request via policy class
     */
    const Route = this.app.use('Adonis/Src/Route')

    Route.Route.macro('policy', function (policyClass) {
      this.middleware([`policy:${policyClass}`])
      return this
    })

    /**
     * Adding resource macro to apply policy on
     * route resource
     */
    Route.RouteResource.macro('policy', function (policiesMap) {
      const middlewareMap = new Map()

      for (const [routeNames, policies] of policiesMap) {
        const middleware = _.castArray(policies).map((policy) => `policy:${policy}`)
        middlewareMap.set(routeNames, middleware)
      }

      this.middleware(middlewareMap)
      return this
    })


    /**
     * Add a new validation rule (all allowed) by extending PolicyValidator
     */
      const PolicyValidator = this.app.use('@jayrchamp/Policy/Validator')
      PolicyValidator.extend('*', () => {})
  }
}

module.exports = PolicyProvider
