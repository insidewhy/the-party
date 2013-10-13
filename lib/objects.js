var compileObject = require('./ast').compileObject;
var parseSourceFile = require('./parser').parseSourceFile;
var fs = require('fs');
var path = require('path');
var generate = require('escodegen').generate;
var CODEGEN_FORMAT = exports.CODEGEN_FORMAT = { indent: { style: '  ' } };
var JSObjects = exports.JSObjects = function () {
    function JSObjects(opts) {
      this.opts = opts;
      this.hash = {};
    }
    JSObjects.prototype._parseSource = function (objectModule, source) {
      var object = this.hash[objectModule] = {
          dirArg: source.dirArg,
          sourcePath: source.path,
          requires: []
        };
      object.ast = compileObject(object, source.ast);
      object.deps = object.requires.map(function (req) {
        return resolveModule(objectModule, req);
      }.bind(this));
    };
    JSObjects.prototype.parseSources = function (sources) {
      sources.forEach(function (source) {
        var sourcePath = source.path;
        var objectModule = sourcePath.replace(/\.(js|es6)/, '');
        var dirArg = source.dirArg;
        if (dirArg && !this.opts.compile)
          objectModule = objectModule.substr(dirArg.length + 1);
        this._parseSource(objectModule, source);
      }.bind(this));
    };
    JSObjects.prototype.getUnresolvedDeps = function () {
      var ret = [];
      Object.keys(this.hash).forEach(function (objectModule) {
        var object = this.hash[objectModule];
        object.deps.forEach(function (depModule) {
        }.bind(this));
        return [];
      }.bind(this));
    };
    JSObjects.prototype.buildSourceCodeFromAsts = function (modules) {
      if (modules === undefined)
        modules = Object.keys(this.hash);
      modules.forEach(function (objectModule) {
        var output, object = this.hash[objectModule], ast = object.ast;
        if (this.opts.sourceMaps) {
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
    };
    JSObjects.prototype.output = function (targetDir) {
      Object.keys(this.hash).forEach(function (objectModule) {
        var object = this.hash[objectModule];
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
    };
    return JSObjects;
  }();
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
function baseModule(mod) {
  if (mod === '')
    return '..';
  var lastSlash = mod.lastIndexOf('/');
  return lastSlash === -1 ? '' : mod.substr(0, lastSlash);
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
function resolveDepPath(depModule, object) {
}