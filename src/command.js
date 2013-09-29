module theparty from './the-party'
module opts from './opts'

export function main(args) {
  opts.parse(args)

  var ret = theparty.compile(opts.args, opts)
  if (opts.dump || opts.dumpSources) {
    console.log(JSON.stringify(ret, null, 2))
  }
}
