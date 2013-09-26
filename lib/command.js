var theparty = require('./the-party');
var opts = require('commander');
exports.main = function (args) {
    opts.option('-o, --output <dir>', 'Output compiled JavaScript files to <dir>').option('-d, --dump', 'Dump ASTs').option(' --dump-locs', 'Include locs in dump').option(' --dump-sources', 'Dump source ASTs rather than compiled ASTs').option('-m, --source-maps', 'Generate source maps').parse(args);
    theparty.compile(opts.args, opts);
};