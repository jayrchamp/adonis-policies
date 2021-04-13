'use strict'

const test = require('japa')
const { setupResolver, Config } = require('@adonisjs/sink')
const { ioc } = require('@adonisjs/fold')
const _ = require('lodash')
const supertest = require('supertest')
const setupApp = require('./setup')
const nanoid = require('nanoid')
const qs = require('qs')


const HOST = 'localhost'
const PORT = 3333

test.group('Policy Middleware', (group) => {
  group.before(async () => {
    await setupApp()
    setupResolver()
  })

  group.beforeEach(() => {
    ioc.restore()
  })

  /**
   * policy.authorize method must handle authorization by throwing a EXCEPTION or returning TRUE
   * if left unhandled or explicitly return false a generic response will end
   */
  test
  // .skip
  ('make generic response when authorize returns false when leaves the request hanging', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      authorize () {
        return false
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok({ foo: 'bar' }))
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')

    assert.equal(response.error.status, 401)
    assert.equal(response.error.text, 'Unauthorized request. Make sure to handle it inside policy.authorize method')

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('should keep all fields on response content if policy.permittedFields method is not defined on policy class', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {}

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok({ foo: 'bar' }))
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, {
      foo: 'bar'
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('response content should keep only contains the fields return by policy.permittedFields method', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedFields () {
        return [
          'foo'
        ]
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok({
        foo: 'bar',
        baz: 'qux'
      }))
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')

    // console.log('response.body', response.body);

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, {
      foo: 'bar'
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedFields support object dot notation filtering', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedFields () {
        return [
          'foo',
          'baz.qux'
        ]
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok({
        foo: 'bar',
        baz: {
          qux: 'quux',
          corge: 'grault'
        }
      }))
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')

    // console.log('response.body', response.body);

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, {
      foo: 'bar',
      baz: {
        qux: 'quux'
      }
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedFields support array of object dot notation filtering', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedFields () {
        return [
          'foo',
          'baz.*.qux'
        ]
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok({
        foo: 'bar',
        baz: [
          {
            qux: 'quux',
            corge: 'grault'
          },
          {
            qux: 'quux',
            corge: 'grault'
          }
        ]
      }))
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')

    // console.log('response.body', response.body);

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, {
      foo: 'bar',
      baz: [
        {
          qux: 'quux'
        },
        {
          qux: 'quux'
        }
      ]
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedFields support deep array of object dot notation filtering', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedFields () {
        return [
          'foo',
          'baz.*.baz.*.corge'
        ]
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok({
        foo: 'bar',
        baz: [
          {
            qux: 'quux',
            corge: 'grault',
            baz: [
              {
                qux: 'quux',
                corge: 'grault'
              },
              {
                qux: 'quux',
                corge: 'grault'
              }
            ]
          },
          {
            qux: 'quux',
            corge: 'grault',
            baz: [
              {
                qux: 'quux',
                corge: 'grault'
              },
              {
                qux: 'quux',
                corge: 'grault'
              }
            ]
          }
        ]
      }))
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, {
      foo: 'bar',
      baz:[
         {
           baz: [
             {
               corge: 'grault'
              },
              {
                corge: 'grault'
              }
          ]
        },
        {
          baz: [
            {
              corge: 'grault'
            },
            {
              corge: 'grault'
            }
          ]
        }
      ]
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery [fields] should return 200 on successful query fields authorization', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedQuery () {
        return {
          foo: '*',
          'baz.foo.garply': '*',
          'baz.foo.qux': '*'
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        foo: 'bar',
        baz: {
          foo: {
            garply: 'grault',
            qux: 'quux'
          }
        }
      }))

    // console.log('response.body', response.body);

    assert.equal(response.status, 200)

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery [fields] should support first level of fields authorization w/ normal query data', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedQuery () {
        return {
          qux: 'in:quux'
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        foo: 'bar',
        qux: 'quux'
      }))

    // console.log('response.body', response.body);

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages:  [
        {
          field: "foo",
          message: "Not authorized on query field foo."
        }
      ]
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery [fields] should support first level of fields authorization w/ dot notation query data', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedQuery () {
        return {
          'baz.qux': 'in:quux'
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        foo: {
          qux: 'quux'
        }
      }))

    // console.log('response.body', response.body);

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages:  [
        {
          field: "foo",
          message: "Not authorized on query field foo."
        }
      ]
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery [fields] should support deep level of fields authorization w/ dot notation query data', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedQuery () {
        return {
          'baz.foo.corge': 'in:grault',
          'baz.foo.qux': 'in:quux'
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        baz: {
          foo: {
            garply: 'grault',
            qux: 'quux'
          }
        }
      }))

    // console.log('response.body', response.body);

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages:  [
        {
          field: "baz.foo.garply",
          message: "Not authorized on query field baz.foo.garply."
        }
      ]
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery [fields.values] should support multiple field value validations', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedQuery () {
        return {
          'baz.foo.qux': 'in:quux',
          'foo.baz.qux': 'in:quux'
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        baz: {
          foo: {
            qux: 'grault'
          }
        },
        foo: {
          baz: {
            qux: 'grault'
          }
        }
      }))

    // console.log('response.body', response.body);

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages:  [
        {
          field: 'baz.foo.qux',
          message: 'Policy validation failed on query field baz.foo.qux',
          validation: 'in'
        },
        {
          field: 'foo.baz.qux',
          message: 'Policy validation failed on query field foo.baz.qux',
          validation: 'in'
        }
      ]
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery [fields.values] should support first level of field value authorization w/ normal query data', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedQuery () {
        return {
          qux: 'in:quux',
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        qux: 'corge'
      }))

    // console.log('response.body', response.body);

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages: [
        {
          field: "qux",
          message: "Policy validation failed on query field qux",
          validation: "in"
        }
      ]
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery [fields.values] should support deep level of field value authorization w/ dot notation query data', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedQuery () {
        return {
          'foo.bar': 'object'
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        foo: {
          bar: [
            {
              baz: 'quux'
            }
          ]
        }
      }))

    // console.log('response.status', response.status);
    // console.log('response.body', response.body);

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages: [
        {
          field: 'foo.bar',
          message: 'Policy validation failed on query field foo.bar',
          validation: 'object'
        }
      ]
    })

    server.close()
  })

  /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery [fields.values] should support array field value authorization w/ dot notation query data', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    class FooBarPolicy {
      permittedQuery () {
        return {
          'foo.bar.*': 'string'
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        foo: {
          bar: [
            {
              baz: 'quux'
            }
          ]
        }
      }))

    // console.log('response.status', response.status);
    // console.log('response.body', response.body);

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages: [
        {
          field: 'foo.bar.0',
          message: 'Policy validation failed on query field foo.bar.0',
          validation: 'string'
        }
      ]
    })

    server.close()
  })

    /**
   *
   */
  test
  // .skip
  ('policy.permittedQuery should also work using rule method from @jayrchamp/Policy/Validator', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    const { rule } = use('@jayrchamp/Policy/Validator')

    class FooBarPolicy {
      permittedQuery () {
        return {
          'foo.bar.*': [
            rule('string')
          ]
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    Route
      .get(routePath, ({ request, response }) => response.ok())
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        foo: {
          bar: [
            {
              baz: 'quux'
            }
          ]
        }
      }))

    // console.log('response.status', response.status);
    // console.log('response.body', response.body);

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages: [
        {
          field: 'foo.bar.0',
          message: 'Policy validation failed on query field foo.bar.0',
          validation: 'string'
        }
      ]
    })

    server.close()
  })

  test
  // .skip
  ('policy.permittedQuery should stop the request before entering the controller', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    const { rule } = use('@jayrchamp/Policy/Validator')

    class FooBarPolicy {
      permittedQuery () {
        return {
          'foo.bar.*': [
            rule('string')
          ]
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    let hasPassedThroughController = false

    Route
      .get(routePath, ({ request, response }) => {
        hasPassedThroughController = true
        response.ok()
      })
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        foo: {
          bar: [
            {
              baz: 'quux'
            }
          ]
        }
      }))

    // console.log('response.status', response.status);
    // console.log('response.body', response.body);

    assert.equal(hasPassedThroughController, false, 'expect the request to have been stopped before passing through the controller')
    assert.equal(response.status, 403)
    assert.deepEqual(response.body, {
      messages: [
        {
          field: 'foo.bar.0',
          message: 'Policy validation failed on query field foo.bar.0',
          validation: 'string'
        }
      ]
    })

    server.close()
  })

  test
  // .skip
  ('policy class should run after validator', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const routePath = `/${nanoid.nanoid()}`

    const { rule } = use('@jayrchamp/Policy/Validator')

    let hasPassedThroughPolicy = false

    class FooBarPolicy {
      permittedQuery () {
        hasPassedThroughPolicy = true
        return {
          'foo.bar.*': [
            rule('string')
          ]
        }
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    class FooBarValidator {
      get rules () {
        return {
          'foo.bar.*': [
            rule('string')
          ]
        }
      }
    }

    const fooBarValidatorPath = 'App/Validators/Foo/BarValidator'
    ioc.fake(fooBarValidatorPath, () => new FooBarValidator())

    Route
      .get(routePath, ({ response }) => response.ok())
      .validator(fooBarValidatorPath)
      .policy(fooBarPolicyPath)

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')
      .query(qs.stringify({
        foo: {
          bar: [
            {
              baz: 'quux'
            }
          ]
        }
      }))

    // console.log('response.status', response.status);
    // console.log('response.body', response.body);

    assert.equal(
      hasPassedThroughPolicy,
      false,
      'expect policy to run after validator if declared before policy on the route handler and therefore prevent policy to run if validator fails'
    )
    assert.equal(response.status, 400)
    assert.deepEqual(response.body, [
      {
        message: 'string validation failed on foo.bar.0',
        field: 'foo.bar.0',
        validation: 'string'
      }
    ])

    server.close()
  })

  test
  // .skip
  ('it should work with Route.resource', async (assert) => {
    const Server = use('Adonis/Src/Server')
    const Route = use('Adonis/Src/Route')
    const resource = `${nanoid.nanoid()}`
    const routePath = `/${resource}`

    class FooBarPolicy {
      permittedFields () {
        return [
          'foo',
          'baz.qux'
        ]
      }
    }

    const fooBarPolicyPath = 'App/Policies/Foo/BarPolicy'
    ioc.fake(fooBarPolicyPath, () => new FooBarPolicy())

    class FooBarController {
      async index ({ request, response }) {
        return response.ok({
          foo: 'bar',
          baz: {
            qux: 'quux',
            corge: 'grault'
          }
        })
      }
    }

    const fooBarControllerPath = 'App/Controllers/Http/Foo/Bar/Controller'
    ioc.fake(fooBarControllerPath, () => new FooBarController())

    Route
      .resource(resource, fooBarControllerPath)
      .only(['index'])
      .policy(new Map([
        [['show'], [fooBarPolicyPath]]
      ]))

    const server = Server.listen(HOST, PORT)
    const response = await supertest(server)
      .get(routePath)
      .accept('json')

    // console.log('response.body', response.body);

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, {
      foo: 'bar',
      baz: {
        qux: 'quux',
        corge: 'grault'
      }
    })

    server.close()
  })
})
