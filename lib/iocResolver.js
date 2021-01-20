'use strict'

class IocResolver {
  constructor () {
    this._fold = null
  }

  /**
   * Set custom fold instance
   *
   * @method setFold
   *
   * @param  {String} fold
   *
   * @return {void}
   */
  setFold (fold) {
    this._fold = fold
  }

  /**
   * Returns fold resolver instance
   *
   * @attribute resolver
   *
   * @return {Object}
   */
  get resolver () {
    return this._fold.resolver
  }

  /**
   * Returns fold ioc container instance
   *
   * @attribute ioc
   *
   * @return {Object}
   */
  get ioc () {
    return this._fold.ioc
  }
}

module.exports = new IocResolver()
