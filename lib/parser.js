var fs = require('fs');
var path = require('path');
var parse = require('esprima-the-party').parse;
var parseSourceFile = exports.parseSourceFile = function (sourcePath, opts) {
    var contents = fs.readFileSync(sourcePath).toString();
    var ast = parse(contents, {
        loc: !opts.withoutLocs,
        source: sourcePath
      });
    return ast;
  };
var argumentsToSources = exports.argumentsToSources = function (args, opts) {
    var sources = [];
    var sourceRe = opts.compile ? /\.es6$/ : /\.(es6|js)$/;
    args.forEach(function (arg) {
      if (fs.statSync(arg).isDirectory()) {
        var dirFiles = opts.dontRecurse ? readdirFiles(arg) : recursiveReaddir(arg);
        dirFiles.forEach(function (sourcePath) {
          if (sourceRe.test(sourcePath)) {
            sources.push({
              path: sourcePath,
              ast: parseSourceFile(sourcePath, opts),
              baseDir: opts.compile ? '.' : arg
            });
          }
        }.bind(this));
      } else {
        sources.push({
          path: arg,
          ast: parseSourceFile(arg, opts),
          baseDir: '.'
        });
      }
    }.bind(this));
    return sources;
  };
var readdirFiles = function (dir) {
    return fs.readdirSync(dir).map(function (f) {
      return path.join(dir, f);
    }.bind(this)).filter(function (f) {
      return !fs.statSync(f).isDirectory();
    }.bind(this));
  }.bind(this);
function recursiveReaddir(dir) {
  var files = [];
  fs.readdirSync(dir).forEach(function (child) {
    child = path.join(dir, child);
    if (fs.statSync(child).isDirectory())
      files = files.concat(recursiveReaddir(child));
    else
      files.push(child);
  }.bind(this));
  return files;
}