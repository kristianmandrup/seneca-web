module.exports.next_service = function(ctx) {
  var services = ctx.services;

  return function next_service(req,res,next,i) {
    if( i < services.length ) {
      var service = services[i]

      if( options.debug.service ) {
        seneca.log.debug(
          'service-chain',req.seneca.fixedargs.tx$,
          req.method,req.url,service.serviceid$,
          util.inspect(service.plugin$) )
      }

      service.call(req.seneca,req,res,function(err){
        if( err ) return next(err);

        next_service(req,res,next,i+1)
      })
    }
    else {
      if( next ) return next();
    }
  }
}
