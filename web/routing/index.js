// ### Route functions

module.exports.specs = require('./specs');

// Default action handler; just calls the action.
module.exports.make_defaulthandler = function make_defaulthandler( spec, routespec, methodspec ) {
  norma('ooo',arguments)

  return function defaulthandler(req,res,args,act,respond) {
    act(args,function(err,out){
      respond(err,out)
    })
  }
}


// Default response handler; applies custom http$ settings, if any
module.exports.make_defaultresponder = function make_defaultresponder( spec, routespec, methodspec ) {
  norma('ooo',arguments)

  return function defaultresponder(req,res,err,obj) {
    obj = (null == obj) ? {} : obj
    var outobj = {}

    if( !_.isObject( obj ) ) {
      err = error('result_not_object',{url:req.url,result:obj.toString()})
    }
    else {
      outobj = _.clone( obj )
    }

    var http = outobj.http$
    if( http ) {
      delete outobj.http$
    }
    else {
      http = {}
    }

    // specific http settings
    http = _.extend({},spec.http,routespec.http,methodspec.http,http)

    // Legacy settings
    if( outobj.redirect$ ) {
      http.redirect = outobj.redirect$
      delete outobj.redirect$
    }

    if( outobj.httpstatus$ ) {
      http.status = outobj.httpstatus$
      delete outobj.httpstatus$
    }

    if( err ) {
      var errobj = err.seneca ? err.seneca : err
      http.redirect = errobj.redirect$   || http.redirect
      http.status   = errobj.httpstatus$ || http.status
    }

    // Send redirect response.
    if( http.redirect ) {
      res.writeHead( http.status || 302, _.extend({
        'Location': http.redirect
      },http.headers))
      res.end()
    }

    // Send JSON response.
    else {
      var outjson = err ? JSON.stringify({error:''+err}) : stringify(outobj)

      http.status = http.status || ( err ? 500 : 200 )

      res.writeHead(http.status,_.extend({
        'Content-Type':  'application/json',
        'Cache-Control': 'private, max-age=0, no-cache, no-store',
        "Content-Length": buffer.Buffer.byteLength(outjson)
      },http.headers))

      res.end( outjson )
    }
  }
}


module.exports.make_redirectresponder = function make_redirectresponder( spec, routespec, methodspec ) {
  norma('ooo',arguments)

  return function(req,res,err,obj) {
    var url = methodspec.redirect || routespec.redirect

    var status = 302 || methodspec.status || routespec.status

    if( err ) {
      url += '?ec='+encodeURIComponent(err.code?err.code:err.message)
      status = err.httpstatus$ || (err.http$ && err.http$.status) || status
    }

    res.writeHead( status, {
      'Location': url
    })
    res.end()
  }
}
