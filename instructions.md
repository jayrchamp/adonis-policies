## Register provider

Make sure to register the provider inside `start/app.js` file.

```js
const providers = [
  '@jayrchamp/adonis-policies/providers/PolicyProvider'
]
```

That's all 🎉

## Route validator

This provider enables to write bind validators to the route.

```js
Route
  .post('api/v1/users', 'UserController.store')
  .policy('V1/User/StorePolicy')
  .validator('V1/User/StoreValidator')
```


Next create the policy file inside `app/Policies` directory.


#### app/Policies/V1/User/StorePolicy.js
```js
class V1UserStorePolicy {
 
  /**
   * Verifies that end-user has access to route.
   */
  async authorize () {}
  
  /**
   * Filters the response content returning only the permitted fields on JSON object.
   */
  async permittedFields () {}
  
  /**
   * Enforces permission validation on query/body data that the end-user has added to the request.
   */
  async permittedQuery (validationRules) {}
}

module.exports = V1UserStorePolicy
```
