var compile = require('./the-party').compile;
var opts = require('./opts');
var main = exports.main = function (args) {
    opts.parse(args);
    if (opts.compile) {
      if (opts.output)
        delete opts.compile;
      else
        opts.output = '.';
    }
    var ret = compile(opts.args, opts);
    if (opts.dump || opts.dumpSources)
      console.log(JSON.stringify(ret, null, 2));
  };