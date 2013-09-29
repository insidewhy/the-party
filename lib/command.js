var theparty = require('./the-party');
var opts = require('./opts');
var main = exports.main = function (args) {
    opts.parse(args);
    var ret = theparty.compile(opts.args, opts);
    if (opts.dump || opts.dumpSources) {
      console.log(JSON.stringify(ret, null, 2));
    }
  };