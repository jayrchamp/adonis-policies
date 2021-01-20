const _ = use('lodash')
const ruleParser = require('./ruleParser')


/**
 *  matchObjectToArray
 *
 * @param {object} obj - An object that will be compared against the array.
 * @param {array} arr - An array of strings (Deep dot notation supported).
 */
function matchObjectToArray (obj, arr) {
  const rules = ruleParser(arr)
  let result = {}
  _.forEach(rules, (rule, key) => {
    result = parseField(obj, key, rule, result)
  })
  return result
}

// function parseFields (content, rules) {
//   let result = {}
//   _.forEach(rules, (rule, key) => {
//     result = parseField(content, key, rule, result)
//   })
//   return result
// }

function parseField (content, key, rule, result = {}) {
  if (_.isArray(content[key]) && rule.type === 'array') {
    result[key] = (result[key] || [])
    content[key].forEach(item => {
      let parsedItem;
      if (_.size(rule.children) <= 0) {
        parsedItem = item
      } else {
        parsedItem = _.reduce(item, (res, v, k) => {
          if (rule.children[k]) {
            parseField(item, k, rule.children[k], res)
          }
          return res
        }, {})
      }
      result[key].push(parsedItem)
    })
  } else if (_.isPlainObject(content[key]) && rule.type === 'object') {
    result[key] = (result[key] || {})
    const parsedItem = _.reduce(content[key], (res, v, k) => {
      if (rule.children[k]) {
        parseField(content[key], k, rule.children[k], res)
      }
      return res
    }, {})
    result[key] = parsedItem
  } else if (content.hasOwnProperty(key) && rule.type === 'literal') {
    result[key] = content[key]
  }
  return result
}


module.exports = matchObjectToArray
