// Define service middleware
module.exports = function define_service( instance, spec, done ) {
  norma('o o|f f',arguments)

  if( _.isFunction( spec ) ) return done( null, spec );

  spec_check.validate(spec,function(err){
    if( err ) return done(err)

    // legacy properties
    spec.postmap = spec.postmap || spec.endware

    spec.prefix    = fixprefix( spec.prefix, options.prefix )
    var pin        = instance.pin( spec.pin )
    var actmap     = make_actmap( pin )
    var routespecs = make_routespecs( actmap, spec, options )

    resolve_actions( instance, routespecs )
    resolve_methods( instance, spec, routespecs, options )
    resolve_dispatch( instance, spec, routespecs, timestats, options )

    var maprouter = make_router( instance, spec, routespecs, routemap )
    var service   = make_service( instance, spec, maprouter )

    return done(null,service)
  })
}
