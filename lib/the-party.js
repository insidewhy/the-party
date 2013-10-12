var parse = require('esprima-the-party').parse;
var fs = require('fs');
var path = require('path');
var ast = require('./ast');
var generate = require('escodegen').generate;
var CompileError = exports.CompileError = function () {
    function CompileError(message) {
      this.name = 'CompileError';
      this.message = message;
    }
    CompileError.prototype = Object.create(Error.prototype, { constructor: { value: CompileError } });
    return CompileError;
  }();
var CODEGEN_FORMAT = { indent: { style: '  ' } };
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
function parseSourceFile(sourcePath, opts) {
  var contents = fs.readFileSync(sourcePath).toString();
  var ast = parse(contents, {
      loc: !opts.withoutLocs,
      source: sourcePath
    });
  return ast;
}
function argumentsToSources(args, opts) {
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
            dirArg: arg
          });
        }
      }.bind(this));
    } else {
      sources.push({
        path: arg,
        ast: parseSourceFile(arg, opts)
      });
    }
  }.bind(this));
  return sources;
}
function mkpath(dir) {
  var mk = '';
  dir.split(path.sep).forEach(function (component) {
    mk = path.join(mk, component);
    if (!fs.existsSync(mk) || !fs.statSync(mk).isDirectory()) {
      if (fs.mkdirSync(mk)) {
        console.error('Could not make path component:', mk);
        process.exit(1);
      }
    }
  }.bind(this));
}
function outputObjects(objects, targetDir) {
  Object.keys(objects).forEach(function (objectModule) {
    var object = objects[objectModule];
    var destPath = path.join(targetDir, objectModule + '.js');
    if (destPath === object.sourcePath) {
      console.error('Source file equals output file for', destPath, 'skipping.');
    } else {
      mkpath(path.dirname(destPath));
      if (object.map)
        fs.writeFileSync(destPath + '.map', object.map);
      fs.writeFileSync(destPath, object.code);
    }
  }.bind(this));
}
var compile = exports.compile = function (arg, opts) {
    if (!opts)
      opts = {};
    if (opts.compile) {
      if (opts.output) {
        console.error('--compile option used with --output, ignoring --compile');
        delete opts.compile;
      } else {
        opts.output = '.';
      }
    }
    if (opts.output && opts.outputFile)
      throw new CompileError('--output and --output-file options conflict');
    opts.withoutLocs = (opts.dump || opts.dumpSources) && !opts.dumpLocs;
    if (typeof arg === 'string') {
      var compiledAst = ast.compileObjectNode(parse(arg));
      return generate(compiledAst, { format: CODEGEN_FORMAT });
    }
    var sources = argumentsToSources(arg, opts);
    if (opts.dumpSources)
      return sources;
    var objects = compileSources(sources, opts);
    if (opts.dump)
      return objects;
    Object.keys(objects).forEach(function (objectModule) {
      var output, object = objects[objectModule], ast = object.ast;
      if (opts.sourceMaps) {
        var tmp = generate(ast, {
            sourceMapWithCode: true,
            sourceMap: true,
            format: CODEGEN_FORMAT
          });
        object.map = tmp.map;
        object.code = tmp.code;
      } else {
        object.code = generate(ast);
      }
    }.bind(this));
    if (opts.output)
      outputObjects(objects, opts.output);
    return objects;
  };
function compileSources(sources, opts, objects) {
  if (!objects)
    objects = {};
  var compileSource = function (objectModule, source) {
      var object = objects[objectModule] = {
          dirArg: source.dirArg,
          sourcePath: source.path,
          requires: []
        };
      object.ast = ast.compileObject(object, source.ast);
      object.deps = object.requires.map(function (req) {
        return resolveModule(objectModule, req);
      }.bind(this));
    }.bind(this);
  sources.forEach(function (source) {
    var sourcePath = source.path;
    var objectModule = sourcePath.replace(/\.(js|es6)/, '');
    var dirArg = source.dirArg;
    if (dirArg && !opts.compile)
      objectModule = objectModule.substr(dirArg.length + 1);
    compileSource(objectModule, source);
  }.bind(this));
  var resolveDep = function (depModule, object) {
    }.bind(this);
  if (opts.outputFile) {
    Object.keys(objects).forEach(function (objectModule) {
      var object = objects[objectModule];
      object.deps.forEach(function (depModule) {
      }.bind(this));
    }.bind(this));
  }
  return objects;
}
function baseModule(mod) {
  if (mod === '')
    return '..';
  var lastSlash = mod.lastIndexOf('/');
  return lastSlash === -1 ? '' : mod.substr(0, lastSlash);
}
function resolveModule(current, mod) {
  var ret = baseModule(current);
  mod.split('/').forEach(function (component) {
    if (component == '..') {
      ret = baseModule(ret);
    } else if (component !== '.') {
      if (ret.length)
        ret += '/';
      ret += component;
    }
  });
  return ret;
}