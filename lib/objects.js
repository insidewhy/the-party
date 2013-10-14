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
          baseDir: source.baseDir,
          sourcePath: source.path,
          requires: []
        };
      object.ast = compileObject(object, source.ast);
      object.deps = object.requires.map(function (req) {
        return resolveModule(objectModule, req);
      }.bind(this));
    };
    JSObjects.prototype.compileSources = function (sources) {
      sources.forEach(function (source) {
        var sourcePath = source.path;
        var objectModule = sourcePath.replace(/\.(js|es6)/, '');
        var baseDir = source.baseDir;
        if (baseDir !== '.')
          objectModule = objectModule.substr(baseDir.length + 1);
        this._parseSource(objectModule, source);
      }.bind(this));
    };
    JSObjects.prototype.compileUnresolvedDeps = function () {
      var ret = [];
      Object.keys(this.hash).forEach(function (objectModule) {
        var object = this.hash[objectModule];
        object.deps.forEach(function (depModule) {
          if (!(depModule in this.hash)) {
            var path = resolveDepPath(depModule, object);
            if (!path)
              throw Error('Could not find dependency module ' + depModule);
            this._parseSource(depModule, {
              path: path,
              ast: parseSourceFile(path, this.opts),
              baseDir: object.baseDir
            });
            ret.push(depModule);
          }
        }.bind(this));
      }.bind(this));
      return ret;
    };
    JSObjects.prototype._buildSourceCodeFromAst = function (object) {
      if (this.opts.sourceMaps) {
        var tmp = generate(object.ast, {
            sourceMapWithCode: true,
            sourceMap: true,
            format: CODEGEN_FORMAT
          });
        object.map = tmp.map;
        object.code = tmp.code;
      } else {
        object.code = generate(object.ast);
      }
    };
    JSObjects.prototype.wrapBodiesInDefine = function () {
      Object.keys(this.hash).forEach(function (objectModule) {
        var ast = this.hash[objectModule].ast;
        var oldBody = ast.body;
        ast.body = [{
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'define'
              },
              arguments: [
                {
                  type: 'Literal',
                  value: objectModule,
                  raw: '\'' + objectModule + '\''
                },
                {
                  type: 'FunctionExpression',
                  id: null,
                  params: [
                    {
                      type: 'Identifier',
                      name: 'require'
                    },
                    {
                      type: 'Identifier',
                      name: 'exports'
                    }
                  ],
                  defaults: [],
                  body: {
                    type: 'BlockStatement',
                    body: oldBody
                  },
                  rest: null,
                  generator: false,
                  expression: false
                }
              ]
            }
          }];
      }.bind(this));
    };
    JSObjects.prototype.output = function (targetDir) {
      Object.keys(this.hash).forEach(function (objectModule) {
        var object = this.hash[objectModule];
        this._buildSourceCodeFromAst(object);
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
    JSObjects.prototype.outputFile = function (file) {
      var header = path.join(path.dirname(fs.realpathSync(__filename)), 'define.js');
      var ast = parseSourceFile(header, { withoutLocs: true });
      var generateModule = function (objectModule) {
          var object = this.hash[objectModule];
          if (!object.generated) {
            object.generated = true;
            object.deps.forEach(generateModule);
            ast.body = ast.body.concat(object.ast.body);
          }
        }.bind(this);
      Object.keys(this.hash).forEach(generateModule);
      var object = { ast: ast };
      this._buildSourceCodeFromAst(object);
      mkpath(path.dirname(file));
      if (object.map)
        fs.writeFileSync(file + '.map', object.map);
      fs.writeFileSync(file, object.code);
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
  var base = path.join(object.baseDir, depModule);
  var test = function (file) {
      return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
    }.bind(this);
  var file = test(base + '.es6');
  if (file)
    return file;
  else
    return test(base + '.js');
}