var compile = require('./the-party').compile;
var opts = require('commander');
opts.option('-c, --compile', 'Compile output files into same directory as sources').option('-m, --source-maps', 'Generate source maps').option('-o, --output <dir>', 'Output compiled JavaScript files to <dir>').option('-d, --dump', 'Dump ASTs').option('-R, --dont-recurse', 'Do not recurse into directory arguments').option('-L, --dump-locs', 'Include locs in dump').option('-S, --dump-sources', 'Dump source ASTs rather than compiled ASTs');
var main = exports.main = function (args) {
    opts.parse(args);
    var ret = compile(opts.args, opts);
    if (opts.dump || opts.dumpSources)
      console.log(JSON.stringify(ret, null, 2));
  };