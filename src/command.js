import compile from './the-party'
module opts from './opts'

export function main(args) {
  opts.parse(args)

  // output overrides compile
  if (opts.compile) {
    if (opts.output)
      delete opts.compile
    else
      opts.output = '.'
  }

  var ret = compile(opts.args, opts)
  if (opts.dump || opts.dumpSources)
    console.log(JSON.stringify(ret, null, 2))
}
