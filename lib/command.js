///////////////////////////////////////////////////////////////////////////////
// THIS FILE IS GENERATED CODE, PLEASE DO NOT MODIFY IT.
///////////////////////////////////////////////////////////////////////////////
var $$$1 = require('./the-party'), compile = $$$1.compile, UsageError = $$$1.UsageError;
var opts = require('commander');
opts.option('-b, --bare', 'Compile without define wrapper, suitable for commonJS module system').option('-c, --compile', 'Compile output files into same directory as sources').option('-d, --dependencies', 'Compile dependencies of files listed on command-line').option('-m, --source-maps', 'Generate source maps').option('-o, --output <dir>', 'Output compiled JavaScript files to <dir>').option('-O, --output-file <file>', 'Compile input files with dependencies into <file>').option('-D, --dump', 'Dump ASTs').option('-R, --dont-recurse', 'Do not recurse into directory arguments').option('-L, --dump-locs', 'Include locs in dump').option('-S, --dump-sources', 'Dump source ASTs rather than compiled ASTs');
var main = exports.main = function (args) {
    opts.parse(args);
    if (opts.compile && opts.output) {
      delete opts.compile;
      console.error('--compile option used with --output, ignoring --compile');
    }
    try {
      var ret = compile(opts.args, opts);
    } catch (e) {
      if (e instanceof UsageError) {
        console.error('error:', e.message);
        process.exit(1);
      } else {
        throw e;
      }
    }
    if (opts.dump || opts.dumpSources)
      console.log(JSON.stringify(ret, null, 2));
  };
