// ### Spec parsing functions

var defaultflags = {useparams:true,usequery:true,data:false}

module.exports.make_routespecs = function make_routespecs( actmap, spec, options ) {
  norma('ooo',arguments)

  var routespecs = []

  _.each( actmap, function(pattern,fname) {
    var routespec = spec.map.hasOwnProperty(fname) ? spec.map[fname] : null

    // Only build a route if explicitly defined in map
    if( !routespec ) return;

    var url = spec.prefix + fname

    // METHOD:true abbrev
    routespec = _.isBoolean(routespec) ? {} : routespec

    if( routespec.alias ) {
      url = spec.prefix + fixalias(routespec.alias)
    }

    routespec.premap = routespec.premap || spec.premap

    routespec.prefix  = spec.prefix
    routespec.suffix  = routespec.suffix || ''
    routespec.fullurl = url + routespec.suffix

    routespec.fname = fname
    routespec.pattern = pattern

    _.each(defaultflags, function(val,flag) {
      routespec[flag] = null == routespec[flag] ? val : routespec[flag]
    })

    if( _.isString(routespec.redirect) && !routespec.responder) {
      routespec.responder = make_redirectresponder( spec, routespec, {} )
    }

    routespecs.push( _.clone(routespec) )
  })

  return routespecs
}


module.exports.resolve_actions = function resolve_actions( instance, routespecs ) {
  norma('oa',arguments)

  _.each( routespecs, function( routespec ) {
    var actmeta = instance.findact( routespec.pattern )
    if( !actmeta ) return;

    var act = function(args,cb) {
      this.act.call(this,_.extend({},routespec.pattern,args),cb)
    }

    routespec.act     = act
    routespec.actmeta = actmeta
  })
}


module.exports.resolve_methods = function resolve_methods( instance, spec, routespecs, options ) {
  norma('ooao',arguments)

  _.each( routespecs, function( routespec ) {

    var methods = {}

    _.each( methodlist, function(method) {
      var methodspec = routespec[method] || routespec[method.toUpperCase()]
      if( !methodspec ) return;

      var handler = methodspec
      if( _.isFunction( methodspec ) || !_.isObject( methodspec ) ) {
        methodspec = { handler:handler }
      }

      methodspec.method = method

      methods[method] = methodspec
    })

    if( 0 === _.keys(methods).length ) {
      methods.get = { method:'get' }
    }

    _.each( methods, function( methodspec) {

      _.each(defaultflags, function(val,flag) {
        methodspec[flag] =
          (null == methodspec[flag]) ? routespec[flag] : methodspec[flag]
      })

      methodspec.handler =
        _.isFunction( methodspec.handler ) ? methodspec.handler :
        _.isFunction( routespec.handler ) ? routespec.handler :
        options.make_defaulthandler( spec, routespec, methodspec )


      if( _.isString(methodspec.redirect) && !methodspec.responder) {
        methodspec.responder =
          options.make_redirectresponder( spec, routespec, methodspec )
      }

      methodspec.responder =
        _.isFunction( methodspec.responder ) ? methodspec.responder :
        _.isFunction( routespec.responder ) ? routespec.responder :
        options.make_defaultresponder( spec, routespec, methodspec )

      methodspec.modify =
        _.isFunction( methodspec.modify ) ? methodspec.modify :
        _.isFunction( routespec.modify ) ? routespec.modify :
        defaultmodify


      methodspec.argparser = make_argparser( instance, options, methodspec )
    })

    routespec.methods = methods
  })
}


module.exports.resolve_dispatch = function resolve_dispatch( instance, spec, routespecs, timestats, options ) {
  norma('ooaoo',arguments)

  _.each( routespecs, function( routespec ) {
    _.each( routespec.methods, function( methodspec, method ) {

      methodspec.dispatch = function( req, res, next ) {
        if( options.debug.service ) {
          instance.log(
            'service-dispatch',req.seneca.fixedargs.tx$,
            req.method,req.url,spec.serviceid$,
            util.inspect(methodspec) )
        }

        var begin = Date.now()
        var args  = methodspec.argparser(req)

        var si = req.seneca

        var respond = function(err,obj){
          var qi = req.url.indexOf('?')
          var url = -1 == qi ? req.url : req.url.substring(0,qi)

          var name = (routespec.actmeta.plugin_fullname || '')+
                ';'+routespec.actmeta.pattern
          timestats.point( Date.now()-begin, name+';'+req.method+';'+url );

          var result = {err:err,out:obj}
          methodspec.modify(result)

          methodspec.responder.call(si,req,res,result.err,result.out)
        }

        var act_si = function(args,done){
          routespec.act.call(si,args,done)
        }

        var premap = routespec.premap || function(){arguments[3]()}

        // legacy signature
        if( 3 == premap.length ) {
          var orig_premap = premap
          premap = function(args,req,res,next){
            orig_premap.call(this,req,res,next)
          }
        }

        premap.call(si,args,req,res,function(err){
          if(err ) return next(err);

          methodspec.handler.call( si, req, res, args, act_si, respond)
        })
      }
    })
  })
}


module.exports.make_argparser = function make_argparser( instance, options, methodspec ) {
  norma('ooo',arguments)

  return function( req ) {
    if( !_.isObject(req.body) && options.warn.req_body ) {
      instance.log.warn(
        'seneca-web: req.body not present! '+
          'Do you need: express_app.use( require("body-parser").json() ?')
    }

    if( methodspec.useparams && options.warn.req_params &&
        !_.isObject(req.params) )
    {
      instance.log.warn(
        'seneca-web: req.params not present! '+
          "To access URL params, you'll express or an appropriate parser module.")
    }

    if( methodspec.usequery && options.warn.req_query &&
        !_.isObject(req.query) )
    {
      instance.log.warn(
        'seneca-web: req.query not present! '+
          "To access the URL query string, you'll need express "+
          "or an appropriate parser module.")
    }

    var data = _.extend(
      {},
      (_.isObject(req.body) && !methodspec.data) ? req.body: {},
      ( methodspec.useparams && _.isObject(req.params) ) ? req.params: {},
      ( methodspec.usequery &&  _.isObject(req.query)  ) ? req.query : {}
    )

    // data flag means put body into separate data property
    if( methodspec.data ) {
      data.data = _.isObject(req.body) ? req.body : {}
      return data;
    }
    else return data;
  }
}
