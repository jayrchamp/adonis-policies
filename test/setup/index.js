'use strict'

const { ioc, registrar } = require('@adonisjs/fold')
const path = require('path')
const { Config } = require('@adonisjs/sink')

module.exports = async () => {
  /**
   * Register Route
   */
  ioc.singleton('Adonis/Src/Route', () => {
    const manager = require('../../node_modules/@adonisjs/framework/src/Route/Manager')
    return manager
  })
  ioc.alias('Adonis/Src/Route', 'Route')

  /**
   * Register HttpContext
   */
  ioc.bind('Adonis/Src/HttpContext', () => {
    return require('../../node_modules/@adonisjs/framework/src/Context')
  })
  ioc.alias('Adonis/Src/HttpContext', 'HttpContext')

  /**
   * Register Request
   */
  ioc.bind('Adonis/Src/Request', () => {
    return require('../../node_modules/@adonisjs/framework/src/Request')
  })

  /**
   * Register Response
   */
  ioc.bind('Adonis/Src/Response', () => {
    return require('../../node_modules/@adonisjs/framework/src/Response')
  })

  /**
   * Register Exceptio
   */
  ioc.singleton('Adonis/Src/Exception', () => {
    return require('../../node_modules/@adonisjs/framework/src/Exception')
  })
  ioc.alias('Adonis/Src/Exception', 'Exception')

  /**
   * Register Base Exception Handler
   */
  ioc.bind('Adonis/Exceptions/BaseExceptionHandler', () => {
    return require('../../node_modules/@adonisjs/framework/src/Exception/BaseHandler')
  })
  ioc.alias('Adonis/Exceptions/BaseExceptionHandler', 'BaseExceptionHandler')
  
  /**
   * Register Helpers
   */
  ioc.singleton('Adonis/Src/Helpers', () => {
    return require('../../node_modules/@adonisjs/ignitor/src/Helpers')
  })
  ioc.alias('Adonis/Src/Helpers', 'Helpers')

  /**
   * Register HttpContext
   */
  ioc.singleton('Adonis/Src/Config', (app) => {
    const config = new Config({
      app: {
        logger: {
          transport: 'asd'
        }
      }
    })

    config.set('app.logger.transport', 'console')
    config.set('app.logger.console', {
      driver: 'console',
      name: 'adonis-app',
      level: 'info'
    })
    return config
  })
  ioc.alias('Adonis/Src/HttpContext', 'HttpContext')

  /**
   * Register Logger
   */
  ioc.singleton('Adonis/Src/Logger', (app) => {
    const LoggerFacade = require('../../node_modules/@adonisjs/framework/src/Logger/Facade')
    return new LoggerFacade(app.use('Adonis/Src/Config'))
  })
  ioc.alias('Adonis/Src/Logger', 'Logger')
  /**
   * Register Validator
   */
  ioc.bind('Adonis/Addons/Validator', () => require('../../node_modules/@adonisjs/validator/src/Validator'))
  ioc.alias('Adonis/Addons/Validator', 'Validator')

  /**
   * Register Server
   */
  ioc.singleton('Adonis/Src/Server', (app) => {
    const Context = app.use('Adonis/Src/HttpContext')
    const Route = app.use('Adonis/Src/Route')
    const Exception = app.use('Adonis/Src/Exception')
    const Helpers = app.use('Adonis/Src/Helpers')
    const Logger = app.use('Adonis/Src/Logger')
    Logger.warning = () => {}
    const Server = require('../../node_modules/@adonisjs/framework/src/Server')
    const server = new Server(Context, Route, Logger, Exception, Helpers)
    server._exceptionHandlerNamespace = 'Adonis/Exceptions/BaseExceptionHandler'
    return server
  })
  ioc.alias('Adonis/Src/Server', 'Server')


  const Context = ioc.use('Adonis/Src/HttpContext')
  const Request = ioc.use('Adonis/Src/Request')
  const Response = ioc.use('Adonis/Src/Response')

  /**
   * Gets the provider load the env file.
   */
  // ioc.use('Adonis/Src/Env')

  Context.getter('request', function () {
    return new Request(this.req, this.res, use('Adonis/Src/Config'))
  }, true)

  Context.getter('response', function () {
    return new Response(this.request, use('Adonis/Src/Config'))
  }, true)

  /**
   * Childs of context can be access when a new instance is
   * ready
   */
  Context.onReady(function (ctx) {
    if (ctx.view && typeof (ctx.view.share) === 'function') {
      ctx.view.share({
        request: ctx.request,
        url: ctx.request.url(),
        is: function (matchWith) {
          return this.url.replace(/^\/|\/$/) === matchWith.replace(/^\/|\/$/)
        }
      })
    }
  })

  await registrar.providers([
    path.join(__dirname, '../../providers/PolicyProvider')
  ])
  .registerAndBoot()
}
