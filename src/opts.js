module opts from 'commander'

module.exports = opts
  .option('-c, --compile', 'Compile output files into same directory as sources')
  .option('-o, --output <dir>', 'Output compiled JavaScript files to <dir>')
  .option('-d, --dump', 'Dump ASTs')
  .option('-L, --dump-locs', 'Include locs in dump')
  .option('-S, --dump-sources', 'Dump source ASTs rather than compiled ASTs')
  .option('-m, --source-maps', 'Generate source maps')
