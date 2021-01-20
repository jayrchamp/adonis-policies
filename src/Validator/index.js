'use strict'

const Validation = require('../Validation')
const { PolicyValidationException, InvalidArgumentException } = require('../Exceptions')

module.exports = function (indicative) {
  return {
    validateAll: (...params) => new Validation(...params).runAll(indicative),
    validate: (...params) => new Validation(...params).run(indicative),
    sanitize: (...params) => indicative.sanitize(...params),
    rule: indicative.rule,
    is: indicative.is,
    sanitizor: indicative.sanitizor,
    configure: indicative.configure,
    formatters: indicative.formatters,
    extend: function (rule, fn) {
      if (typeof (fn) !== 'function') {
        throw InvalidArgumentException.invalidParameter('PolicyValidator.extend expects 2nd parameter to be a function', fn)
      }
      indicative.validations[rule] = fn
    },
    PolicyValidationException,
    validations: indicative.validations
  }
}
