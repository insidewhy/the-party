var parse = require('esprima-the-party').parse;
var fs = require('fs');
var path = require('path');
var ast = require('./ast');
var generate = require('escodegen').generate;
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
function parseSourceFiles(sourcePaths, opts) {
  var noLocs = (opts.dump || opts.dumpSources) && !opts.dumpLocs;
  var sources = {};
  var parseSourceFile = function (sourcePath, dir) {
      var contents = fs.readFileSync(sourcePath).toString();
      var ast = parse(contents, {
          loc: !noLocs,
          source: sourcePath
        });
      sources[sourcePath] = {
        ast: ast,
        dir: dir
      };
    }.bind(this);
  var sourceRe = opts.compile ? /\.es6$/ : /\.(es6|js)$/;
  sourcePaths.forEach(function (sourcePath) {
    if (fs.statSync(sourcePath).isDirectory()) {
      var dirFiles = opts.dontRecurse ? readdirFiles(sourcePath) : recursiveReaddir(sourcePath);
      dirFiles.forEach(function (file) {
        if (sourceRe.test(file))
          parseSourceFile(file, sourcePath);
      }.bind(this));
    } else {
      parseSourceFile(sourcePath, null);
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
function outputCode(objects, targetDir) {
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
var compile = exports.compile = function (scripts, opts) {
    if (opts && opts.compile) {
      if (opts.output) {
        console.error('--compile option used with --output, ignoring --compile');
        delete opts.compile;
      } else {
        opts.output = '.';
      }
    }
    if (typeof scripts === 'string') {
      var compiledAst = ast.compileObjectNode(parse(scripts));
      return generate(compiledAst, { format: CODEGEN_FORMAT });
    }
    var sources = parseSourceFiles(scripts, opts);
    if (opts.dumpSources)
      return sources;
    var objects = compileAsts(sources, opts);
    if (opts.dump)
      return objects;
    var code = {};
    Object.keys(objects).forEach(function (objectModule) {
      var output, object = objects[objectModule], ast = object.ast;
      var codeEntry = {};
      if (opts.sourceMaps) {
        var tmp = generate(ast, {
            sourceMapWithCode: true,
            sourceMap: true,
            format: CODEGEN_FORMAT
          });
        codeEntry.map = tmp.map;
        codeEntry.code = tmp.code;
      } else {
        codeEntry.code = generate(ast);
      }
      codeEntry.sourceDir = object.sourceDir;
      code[objectModule] = codeEntry;
    }.bind(this));
    if (opts.output)
      outputCode(code, opts.output);
    return code;
  };
function compileAsts(sources, opts, objects) {
  if (!objects)
    objects = {};
  Object.keys(sources).forEach(function (sourcePath) {
    var source = sources[sourcePath];
    var objectModule = sourcePath.replace(/\.(js|es6)/, '');
    var sourceDir = source.dir;
    if (sourceDir && !opts.compile)
      objectModule = objectModule.substr(sourceDir.length + 1);
    var object = objects[objectModule] = {
        sourceDir: sourceDir,
        sourcePath: sourcePath,
        requires: []
      };
    object.ast = ast.compileObject(object, source.ast);
    object.deps = object.requires.map(function (req) {
      return resolveModule(objectModule, req);
    }.bind(this));
  }.bind(this));
  Object.keys(objects).forEach(function (objectModule) {
    objects[objectModule].deps.forEach(function (dep) {
    }.bind(this));
  }.bind(this));
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