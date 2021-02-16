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
'use strict'

const Policy = use('@jayrchamp/Policy')

class V1UserStorePolicy extends Policy {
 
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
  async permittedQuery () {}
}

module.exports = V1UserStorePolicy
```

### Using traits

```js
// app/Policies/V1/User/StorePolicy.js

'use strict'

const Policy = use('@jayrchamp/Policy')

class V1UserStorePolicy extends Policy{

  static get traits() {
    return [
      'Auth'
    ]
  }
 
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
  async permittedQuery () {}
}

module.exports = V1UserStorePolicy
```

```js
// app/Policies/Traits/Auth.js

'use strict'

class AuthPolicyTrait {

  register (Policy, options) {

    Policy.prototype.isSelf = function () {
      return this.ctx.auth.user && this.ctx.auth.user.id == this.ctx.params.userId
    }

    Policy.prototype.isSuperAdmin = async function () {
      return !!(this.ctx.auth.user && await this.ctx.auth.user.hasRole('super_admin'))
    }

    Policy.prototype.isGuestOrAuth = async function () {
      try {
        await this.ctx.auth.check()
      } catch (error) {
        if (error.code === 'E_JWT_TOKEN_EXPIRED') {
          throw error
        }
      }
      return true
    }
  }
}
module.exports = AuthPolicyTrait
```
