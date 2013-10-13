import {compile, CompileError} from './the-party'
module opts from 'commander'

opts
  .option('-c, --compile', 'Compile output files into same directory as sources')
  .option('-d, --dependencies', 'Compile dependencies of files listed on command-line')
  .option('-m, --source-maps', 'Generate source maps')
  .option('-o, --output <dir>', 'Output compiled JavaScript files to <dir>')
  .option('-O, --output-file <file>', 'Compile input files with dependencies into <file>')
  .option('-D, --dump', 'Dump ASTs')
  .option('-R, --dont-recurse', 'Do not recurse into directory arguments')
  .option('-L, --dump-locs', 'Include locs in dump')
  .option('-S, --dump-sources', 'Dump source ASTs rather than compiled ASTs')

export function main(args) {
  opts.parse(args)

  try {
    var ret = compile(opts.args, opts)
  }
  catch (e) {
    if (e instanceof CompileError) {
      console.error("error:", e.message)
      process.exit(1)
    }
    else {
      throw e
    }
  }

  if (opts.dump || opts.dumpSources)
    console.log(JSON.stringify(ret, null, 2))
}
