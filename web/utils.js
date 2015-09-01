// ### Utility functions

// Convert an object to a JSON string, handling circular refs.
module.exports.stringify = function stringify(obj,indent,depth,decycler) {
  indent = indent || null
  depth  = depth || 0
  decycler = decycler || null
  return json_stringify_safe(obj,indent,depth,decycler)
}


// Ensure the URL prefix is well-formed.
module.exports.fixprefix = function fixprefix( prefix, defaultprefix ) {
  prefix = null != prefix ? prefix : defaultprefix

  if( !prefix.match(/\/$/) ) {
    prefix += '/'
  }

  if( !prefix.match(/^\//) ) {
    prefix = '/'+prefix
  }

  return prefix
}


// Ensure alias has no leading slash.
module.exports.fixalias = function fixalias( alias ) {
  alias = null != alias ? ''+alias : ''

  alias = alias.replace(/^\/+/,'')

  return alias
}


// Map action pin function names to action patterns.
// The function names form part of the URL.
module.exports.make_actmap = function make_actmap( pin ) {
  var actmap = {}

  for( var fn in pin ) {
    var f = pin[fn]
    if( _.isFunction(f) && null != f.pattern$ ) {
      actmap[f.name$] = f.pattern$
    }
  }

  return actmap
}



module.exports.defaultmodify = function defaultmodify( result ) {

  // strip out $ properties, apart from http$, which is dealt with later
  if( _.isObject( result.out ) ) {
    _.each(result.out,function(v,k){
      if(~k.indexOf('$') && 'http$' !== k) {
        delete result.out[k]
      }
    })
  }
}
