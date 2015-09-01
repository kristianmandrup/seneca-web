// Action _role:web, stats:true_.
module.exports = function action_stats(args,done) {
  var stats = {}
  this.act('role:web,list:route',function(err,list){
    if( err ) return done(err);

    _.each(list, function(route){
      var pluginname = (route.service &&
                        route.service.plugin &&
                        route.service.plugin.name) || '-'
      var name = pluginname+';'+route.method+';'+route.url
      stats[name] = {}
    })

    _.each( timestats.names(), function(name) {
      stats[name] = timestats.calculate(name)
    })

    done(null,stats)
  })
}
