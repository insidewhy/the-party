var $$$1 = require('./the-party'), compile = $$$1.compile, CompileError = $$$1.CompileError;
var opts = require('commander');
opts.option('-c, --compile', 'Compile output files into same directory as sources').option('-m, --source-maps', 'Generate source maps').option('-o, --output <dir>', 'Output compiled JavaScript files to <dir>').option('-O, --output-file <file>', 'Compile input files with dependencies into <file>').option('-d, --dump', 'Dump ASTs').option('-R, --dont-recurse', 'Do not recurse into directory arguments').option('-L, --dump-locs', 'Include locs in dump').option('-S, --dump-sources', 'Dump source ASTs rather than compiled ASTs');
var main = exports.main = function (args) {
    opts.parse(args);
    try {
      var ret = compile(opts.args, opts);
    } catch (e) {
      if (e instanceof CompileError) {
        console.error('error:', e.message);
        process.exit(1);
      } else {
        throw e;
      }
    }
    if (opts.dump || opts.dumpSources)
      console.log(JSON.stringify(ret, null, 2));
  };