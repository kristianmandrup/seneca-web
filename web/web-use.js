// Action: _role:web_
module.exports = function web_use( args, done ) {
  var seneca = this

  // The plugin is defining some client-side configuration.
  if( args.config && args.plugin ) {
    configmap[args.plugin] =
      _.extend( {}, configmap[args.plugin]||{}, args.config )

    initsrc = init_template({_:_,configmap:configmap})
  }


  if( args.use ) {
    // Add service to middleware layers, order is significant
    args.use.plugin$    = args.plugin$
    args.use.serviceid$ = nid()
    route_list_cache    = null

    define_service(seneca,args.use,function(err,service){
      if( err ) return done(err);

      if( service ) {
        services.push( service )
        servicemap[service.serviceid$] = service
      }

      done();
    })
  }
  else done();
}
