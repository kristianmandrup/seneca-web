module.exports = function(ctx) {
  var seneca = ctx.seneca;

  return function( req, res, next ) {
    res.seneca = req.seneca = seneca.root.delegate({
      req$: req,
      res$: res,
      tx$:  seneca.root.idgen()
    })

    next_service(req,res,next,0)
  }
}
