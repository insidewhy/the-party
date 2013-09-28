module theparty from './the-party'
module opts from './opts'

exports.main = args => {
  opts.parse(args)

  var ret = theparty.compile(opts.args, opts)
  if (opts.dump || opts.dumpSources) {
    console.log(JSON.stringify(ret, null, 2))
  }
}
