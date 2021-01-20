/**
 * Parses the schema object to a tree of parsed schema. The
 * output is optimized for executing validation rules.
 *
 * @example
 * ```
 * parser([
 *  'users.*.username'
 * ])
 *
 * // output
 *
 * {
 *   users: {
 *    type: 'array',
 *     children: {
 *      username: {
 *       type: 'literal'
 *      }
 *     }
 *    }
 *   }
 * }
 * ```
 */
function parser (fields) {
  return fields.reduce((result, field) => {
    parseFieldForRules(field.split('.'), [], result)
    return result
  }, {})
}


function parseFieldForRules (tokens, rules, out, index = 0 ) {
  const token = tokens[index++]

  /**
   * Finding if we are on the last item. Last item defines
   * the rules for the current node inside the tree
   */
  const isLast = tokens.length === index

  /**
   * Indexed array have `digits` like `users.0.username`
   */
  const isIndexedArray = /^\d+$/.test(tokens[index])

  /**
   * Is upcoming token an array
   */
  const isArray = tokens[index] === '*' || isIndexedArray

  /**
   * Last item was marked as array, since current token is a `*`
   * or has defined index
   */
  if (token === '*' || /^\d+$/.test(token)) {
    /**
     * Last item must update rules for each item for the array
     */
    if (isLast) {
      // (out).each[token].rules = rules
      return
    }

    /**
     * Nested arrays
     */
    if (isArray) {
      /**
       * The code after the error works fine. However, in order to support
       * 2d arrays, we need to implement them inside the declarative
       * schema and compiler as well.
       *
       * For now, it's okay to skip this feature and later work on it
       * across all the modules.
       */
      throw new Error('2d arrays are currently not supported')
      // const item = setArray(
      //   (out as SchemaNodeArray).each[token].children,
      //   token,
      //   isIndexedArray ? tokens[index] : '*',
      // )
      // return parseFieldForRules(tokens, rules, item, index)
    }

    /**
     * Otherwise continue recursion
     */
    return parseFieldForRules(tokens, rules, (out).children, index)
    // return parseFieldForRules(tokens, rules, (out).each[token].children, index)
  }

  /**
   * Last item in the list of tokens. we must
   * patch the rules here.
   */
  if (isLast) {
    setLiteral(out, token, rules)
    return
  }

  /**
   * Current item as an array
   */
  if (isArray) {
    const item = setArray(out, token, isIndexedArray ? tokens[index] : '*')
    return parseFieldForRules(tokens, rules, item, index)
  }

  /**
   * Falling back to object
   */
  const item = setObject(out, token)
  return parseFieldForRules(tokens, rules, item.children, index)
}


/**
 * Updates rules on the given node. If node is missing, then a literal node is
 * created automatically. Literal nodes can later transform into `object` and
 * `array` nodes.
 */
function setLiteral (source, key, rules) {
  const item = (source[key] || { type: 'literal' })
  source[key] = item

  return item
}

/**
 * Creates/updates literal node to an object node. Since `object` node
 * properties are different from `literal` node, we need to set those
 * properties (if missing).
 *
 * If node already exists and is an array node, then this method will raise an
 * exception
 */
function setObject (source, key) {
  if (source[key] && source[key].type === 'array') {
    throw new Error(`cannot reshape ${key} array to an object`)
  }

  const item = (source[key] || {})
  item.type = 'object'
  item.children = item.children || {}

  source[key] = item
  return item
}

/**
 * Creates/updates literal node to an array node. Since `array` node
 * properties are different from `literal` node, we need to set those
 * properties (if missing).
 *
 * If node already exists and is an object node, then this method will raise an
 * exception
 */
function setArray (source, key, index) {
  if (source[key] && source[key].type === 'object') {
    throw new Error(`cannot reshape ${key} object to an array`)
  }

  const item = (source[key] || {})
  item.type = 'array'
  item.children = item.children || {}

  source[key] = item
  return item
}


module.exports = parser
