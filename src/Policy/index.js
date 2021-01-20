'use strict'

const GE = require('@adonisjs/generic-exceptions')
const { resolver } = require('../../lib/iocResolver')

const BasePolicy = require('./Base')

class Policy extends BasePolicy  {
  /**
   * Boot policy if not booted. This method is supposed
   * to be executed via IoC container hooks.
   *
   * @method _bootIfNotBooted
   *
   * @return {void}
   *
   * @private
   *
   * @static
   */
  static _bootIfNotBooted () {
    if (!this.$booted) {
      this.$booted= true
      this.boot()
    }
  }

  /**
   * An array of methods to be called everytime
   * a policy is imported via ioc container.
   *
   * @attribute iocHooks
   *
   * @return {Array}
   *
   * @static
   */
  static get iocHooks () {
    return ['_bootIfNotBooted']
  }

  /**
   * Adds a new trait to the policy. Ideally it does a very
   * simple thing and that is to pass the policy class to
   * your trait and you own it from there.
   *
   * @method addTrait
   *
   * @param  {Function|String} trait - A plain function or reference to IoC container string
   */
  static addTrait (trait, options = {}) {
    if (typeof (trait) !== 'function' && typeof (trait) !== 'string') {
      throw GE
        .InvalidArgumentException
        .invalidParameter('Policy.addTrait expects an IoC container binding or a closure', trait)
    }

    /**
     * If trait is a string, then point to register function
     */
    trait = typeof (trait) === 'string' ? `${trait}.register` : trait
    const { method } = resolver.forDir('policyTraits').resolveFunc(trait)
    method(this, options)
  }

}
module.exports = Policy
