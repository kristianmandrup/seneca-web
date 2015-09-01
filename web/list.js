// Action _role:web, list:service_.
module.exports.list_service = function list_service( args, done ) {
  done( null, _.clone(services) )
}


// Action _role:web, list:route_.
module.exports.list_route = function list_route( args, done ) {
  if( null == route_list_cache ) {
    route_list_cache = []
    var methods = _.keys(routemap)
    _.each(methods,function(method){
      var urlmap = routemap[method]
      if( urlmap ) {
        _.each( urlmap, function(srv,url) {
          route_list_cache.push({
            url:     url,
            method:  method.toUpperCase(),
            service: srv
          })
        })
      }
    })
    route_list_cache.sort(function(a,b){
      return a.url == b.url ? 0 : a.url < b.url ? -1 : +1
    })
  }

  done( null, _.clone(route_list_cache) )
}
