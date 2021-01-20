'use strict'

const test = require('japa')
const { setupResolver } = require('@adonisjs/sink')
const { ioc } = require('@adonisjs/fold')
const setupApp = require('./setup')

test.group('Policy Validator', (group) => {
  group.before(async () => {
    await setupApp()
    setupResolver()
  })

  group.beforeEach(() => {
    ioc.restore()
  })


  test
  // .skip
  ('do not throw on validation errors', async (assert) => {
    const PolicyValidator = use('@jayrchamp/Policy/Validator')
    const validation = await PolicyValidator.validate({ email: '' }, { email: 'required' })
    assert.isArray(validation._errorMessages)
  })

  test
  // .skip
  ('return true from fails when there are validation errors', async (assert) => {
    const PolicyValidator = use('@jayrchamp/Policy/Validator')
    const validation = await PolicyValidator.validate({ email: '' }, { email: 'required' })
    assert.isTrue(validation.fails())
  })

  test
  // .skip
  ('return array of error message', async (assert) => {
    const PolicyValidator = use('@jayrchamp/Policy/Validator')
    const validation = await PolicyValidator.validate({ email: '' }, { email: 'required' })
    assert.deepEqual(validation.messages(), [{
      field: 'email',
      message: 'Not authorized value on query field email',
      validation: 'required'
    }])
  })

  test
  // .skip
  ('run all validations', async (assert) => {
    assert.plan(1)

    const PolicyValidator = use('@jayrchamp/Policy/Validator')
    const validation = await PolicyValidator.validateAll({ email: '' }, { email: 'required', age: 'required' })

    assert.deepEqual(validation.messages(), [
      {
        field: 'email',
        validation: 'required',
        message: 'Not authorized value on query field email'
      },
      {
        field: 'age',
        validation: 'required',
        message: 'Not authorized value on query field age'
      }
    ])
  })

  test
  // .skip
  ('show custom error messages', async (assert) => {
    assert.plan(1)

    const PolicyValidator = use('@jayrchamp/Policy/Validator')

    const validation = await PolicyValidator.validate(
      { email: '' },
      { email: 'required', age: 'required' },
      { 'email.required': 'Not authorized ... custom message' }
    )

    assert.deepEqual(validation.messages(), [
      {
        field: 'email',
        validation: 'required',
        message: 'Not authorized ... custom message'
      }
    ])
  })

  test
  // .skip
  ('use jsonapi formatter', async (assert) => {
    assert.plan(1)

    const PolicyValidator = use('@jayrchamp/Policy/Validator')

    const validation = await PolicyValidator.validate(
      { email: '' },
      { email: 'required', age: 'required' },
      { 'email.required': 'Not authorized ... custom message' },
      PolicyValidator.formatters.JsonApi
    )

    assert.deepEqual(validation.messages(), {
      errors: [
        {
          source: { pointer: 'email' },
          title: 'required',
          detail: 'Not authorized ... custom message'
        }
      ]
    })
  })
})
