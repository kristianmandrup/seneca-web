module.exports.make_router = function make_router(instance,spec,routespecs,routemap) {
  norma('ooao',arguments)

  var routes = []
  var mr = httprouter(function(http){
    _.each( routespecs, function( routespec ) {
      _.each( routespec.methods, function( methodspec, method ) {

        instance.log.debug('http',method,routespec.fullurl)
        http[method](routespec.fullurl, methodspec.dispatch)

        var rm = (routemap[method] = (routemap[method]||{}))
        rm[routespec.fullurl] = {
          pattern:   routespec.pattern,
          plugin:    spec.plugin$,
          serviceid: spec.serviceid$,
          prefix:    spec.prefix
        }

        routes.push( method.toUpperCase()+' '+routespec.fullurl )
      })
    })
  })

  mr.routes$ = routes

  return mr;
}


module.exports.make_service = function make_service( instance, spec, maprouter ) {
  var service = function service(req,res,next) {
    var si = req.seneca || instance

    if( spec.startware ) {
      spec.startware.call(si,req,res,do_maprouter)
    }
    else do_maprouter();

    function do_maprouter(err) {
      if(err) return next(err);

      maprouter(req,res,function(err){
        if(err) return next(err);

        if( spec.postmap ) {
          spec.postmap.call(si,req,res,function(err){
            return next(err);
          })
        }
        else return next();
      })
    }
  }

  service.pin$       = spec.pin
  service.plugin$    = spec.plugin$
  service.serviceid$ = spec.serviceid$
  service.routes$    = maprouter.routes$

  return service;
}
