// Service specification schema.
module.exports = parambulator({
  type$:     'object',
  pin:       {required$:true},
  map:       {required$:true,object$:true},
  prefix:    'string$',
  startware: 'function$',
  premap:    'function$',

  endware:   'function$',
  postmap:   'function$',
}, {
  topname:'spec',
  msgprefix:'web-use: ',
})
