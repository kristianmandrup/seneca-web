module.exports = function add_action_patterns() {
  seneca

  // Define a web service API.
    .add( 'role:web', web_use)

  // List known web services.
    .add( 'role:web, list:service', list_service)

  // List known routes.
    .add( 'role:web, list:route', list_route)

  // Provide route performance statistics.
    .add( 'role:web, stats:true', action_stats)

  // Get client-side configuration.
    .add( 'role:web, get:config', get_config)

  // Set client-side source code.
    .add( 'role:web, set:source', set_source)

  // Get client-side source code list.
    .add( 'role:web, get:sourcelist', get_sourcelist)
}
