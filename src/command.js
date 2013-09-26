module theparty from './the-party'
module opts from 'commander'

exports.main = function(args) {
  opts
    .option('-o, --output <dir>', 'Output directory')
    .option('-d, --dump', 'Dump ASTs')
    .option(' --dump-locs', 'Include locs in dump')
    .option(' --dump-sources', 'Dump source ASTs rather than compiled ASTs')
    .option('-s, --source-maps', 'Generate source maps')
    .parse(args)

  theparty.compile(opts.args, opts)
}
