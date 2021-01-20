'use strict'

const _ = require('lodash')

class BasePolicy {
  static boot () {
    _.each(this.traits, (trait) => this.addTrait(trait))
  }
}

module.exports = BasePolicy
