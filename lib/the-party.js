var parse = require('esprima-the-party').parse;
var fs = require('fs');
var path = require('path');
var ast = require('./ast');
var generate = require('escodegen').generate;
var CODEGEN_FORMAT = { indent: { style: '  ' } };
function recursiveGlob(dir, pattern) {
  var files = [];
  fs.readdirSync(dir).forEach(function (child) {
    child = path.join(dir, child);
    if (fs.statSync(child).isDirectory())
      files = files.concat(recursiveGlob(child, pattern));
    else if (pattern.test(child))
      files.push(child);
  }.bind(this));
  return files;
}
function parseScripts(sourcePaths, opts) {
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
      recursiveGlob(sourcePath, sourceRe).forEach(function (file) {
        parseSourceFile(file, opts.compile ? null : sourcePath);
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
function outputCode(compiledSources, targetDir) {
  Object.keys(compiledSources).forEach(function (sourcePath) {
    var compiled = compiledSources[sourcePath];
    if (compiled.sourceDir)
      sourcePath = sourcePath.substr(compiled.sourceDir.length);
    var destPath = path.join(targetDir, sourcePath);
    destPath = destPath.replace(/\.es6$/, '.js');
    if (destPath === sourcePath) {
      console.error('Source file equals output file for', destPath, 'skipping.');
    } else {
      mkpath(path.dirname(destPath));
      if (compiled.map)
        fs.writeFileSync(destPath + '.map', compiled.map);
      fs.writeFileSync(destPath, compiled.code);
    }
  }.bind(this));
}
var compile = exports.compile = function (scripts, opts) {
    if (typeof scripts === 'string') {
      var compiledAst = ast.compileObjectNode(parse(scripts));
      return generate(compiledAst, { format: CODEGEN_FORMAT });
    }
    var sources = parseScripts(scripts, opts);
    if (opts.dumpSources)
      return sources;
    var objects = ast.compile(sources, opts);
    if (opts.dump)
      return objects;
    var code = {};
    Object.keys(objects).forEach(function (sourcePath) {
      var output, object = objects[sourcePath], ast = object.ast;
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
      code[sourcePath] = codeEntry;
    }.bind(this));
    if (opts.output)
      outputCode(code, opts.output);
    return code;
  };