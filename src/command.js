module theparty from './the-party'
module opts from 'commander'

exports.main = args => {
  opts
    .option('-o, --output <dir>', 'Output compiled JavaScript files to <dir>')
    .option('-d, --dump', 'Dump ASTs')
    .option('-L, --dump-locs', 'Include locs in dump')
    .option('-S, --dump-sources', 'Dump source ASTs rather than compiled ASTs')
    .option('-m, --source-maps', 'Generate source maps')
    .parse(args)

  var ret = theparty.compile(opts.args, opts)
  if (opts.dump || opts.dumpSources) {
    console.log(JSON.stringify(ret, null, 2))
  }
}
