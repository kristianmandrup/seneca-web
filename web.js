/* Copyright (c) 2013-2015 Richard Rodger, MIT License */
/* jshint node:true, asi:true, eqnull:true */
"use strict";


var util   = require('util')
var buffer = require('buffer')


var _                   = require('lodash')
var parambulator        = require('parambulator')
var mstring             = require('mstring')
var nid                 = require('nid')
var connect             = require('connect')
var serve_static        = require('serve-static')
var json_stringify_safe = require('json-stringify-safe')
var stats               = require('rolling-stats')
var norma               = require('norma')

var error = require('eraro')({
  package:  'seneca',
  msgmap:   ERRMSGMAP(),
  override: true
})


var httprouter = require('./http-router')
var methodlist = _.clone(httprouter.methods)


module.exports = function( options ) {
  /* jshint validthis:true */
  norma('o',arguments)

  var seneca = this

  options = seneca.util.deepextend({

    // URL prefix for all generated paths
    prefix: '/api/',

    // URL prefix for content provided by this plugin
    contentprefix: '/seneca',

    // Endpoint call statistics, see https://github.com/rjrodger/rolling-stats
    stats: {
      size:     1024,
      duration: 60000,
    },

    // Default function builders
    make_defaulthandler:    make_defaulthandler,
    make_defaultresponder:  make_defaultresponder,
    make_redirectresponder: make_redirectresponder,

    // Log warnings for invalid requests
    warn: {
      req_body: true,
      req_params: true,
      req_query: true,
    },


    // Extended debugging
    debug: {
      service: false
    }

  },options)


  var timestats = new stats.NamedStats( options.stats.size, options.stats.duration )

  // Ordered list of middleware services.
  var services = []

  var configmap  = {}
  var servicemap = {}

  var routemap = {}
  var route_list_cache = null

  var init_template = _.template(mstring(
    function(){/***
      ;(function(){
        var w = this
        var seneca = w.seneca || (w.seneca={})
        seneca.config = {}
        <% _.each(configmap,function(data,name){%>
        seneca.config[<%=JSON.stringify(name)%>] = <%=JSON.stringify(data)%>
        <%})%>
      }).call(window);
      ***/}))

  var initsrc = init_template({_:_,configmap:configmap})

  var sourcelist = []

  web_use.validate = {
    // Use a mapping, or custom middleware function
    use: {},

    // Client-side configuration for named plugin.
    config: {object$:true},

    // Client-side name for the plugin.
    plugin: {string$:true},
  }



  // Action: _role:web, cmd:source_
  function set_source( args, done ) {
    sourcelist.push('\n;// '+args.title+'\n'+args.source)
    done()
  }

  set_source.validate = {
    title:  { string$:true },
    source: { required$:true, string$:true },
  }


  // Action _role:web, get:sourcelist_
  function get_sourcelist( args, done ) {
    done( null, _.clone(sourcelist) )
  }


  // Action _role:web, get:config_
  function get_config( args, done ) {
    done( null, _.clone(configmap[args.plugin] || {}) )
  }

  get_config.validate = {
    plugin: { required:true, string$:true },
  }




  var action_stats = require('./web/action-stats');
  var add_action_patterns = require('./web/add-action-patterns');
  var web_use = require('./web/web-use');

  add_action_patterns();

  var list = require('./web/list');

  // Service specification schema.
  var spec_check = require('./web/service/schema');
  var define_service = require('./web/service/define');


  // Define exported middleware function
  // TODO is connect the best option here?

  var app = connect()
  app.use(serve_static(__dirname+'/web'))

  var use = function(req, res, next){
    if( 0 === req.url.indexOf(options.contentprefix) ) {
      if( 0 === req.url.indexOf(options.contentprefix+'/init.js') ) {
        res.writeHead(200,{'Content-Type':'text/javascript'})
        return res.end(initsrc+sourcelist.join('\n'));
      }

      req.url = req.url.substring(options.contentprefix.length)
      return app( req, res );
    }
    else return next();
  }

  var next_service = require('./web/service/next')(this);
  var web = require('./web')(this);

  seneca.add({init:'web'},function(args,done) {
    var seneca = this

    var config = {prefix:options.contentprefix}

    seneca.act({role:'web', plugin:'web', config:config, use:use})

    seneca.act({role:'basic',note:true,cmd:'push',key:'admin/units',value:{
      unit:'web-service',
      spec:{
        title:'Web Services',
        ng:{module:'senecaWebServiceModule',directive:'seneca-web-service'}
      },
      content:[
        {type:'js',file:__dirname+'/web/web-service.js'},
      ]
    }})

    done()
  })


  return {
    name: 'web',
    export: web,
    exportmap: {
      httprouter:httprouter
    }
  }
}

var routing = require('./web/routing')
