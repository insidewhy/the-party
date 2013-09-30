var parse = require('esprima-the-party').parse;
var fs = require('fs');
var path = require('path');
var ast = require('./ast');
var generate = require('escodegen').generate;
var CODEGEN_FORMAT = { indent: { style: '  ' } };
function parseScripts(sourcePaths, noLocs) {
  var asts = {};
  sourcePaths.forEach(function (sourcePath) {
    var contents = fs.readFileSync(sourcePath).toString();
    asts[sourcePath] = parse(contents, {
      loc: !noLocs,
      source: sourcePath
    });
  }.bind(this));
  return asts;
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
    var destPath = path.join(targetDir, sourcePath);
    mkpath(path.dirname(destPath));
    if (compiled.map)
      fs.writeFileSync(destPath + '.map', compiled.map);
    fs.writeFileSync(destPath, compiled.code);
  }.bind(this));
}
var compile = exports.compile = function (scripts, opts) {
    if (typeof scripts === 'string') {
      var compiledAst = ast.compileObjectNode(parse(scripts));
      return generate(compiledAst, { format: CODEGEN_FORMAT });
    }
    var asts = parseScripts(scripts, (opts.dump || opts.dumpSources) && !opts.dumpLocs);
    if (opts.dumpSources)
      return asts;
    var compiled = ast.compile(asts);
    if (opts.dump)
      return compiled;
    var code = {};
    Object.keys(compiled).forEach(function (sourcePath) {
      var output, ast = compiled[sourcePath];
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
      code[sourcePath] = codeEntry;
    }.bind(this));
    if (opts.output)
      outputCode(code, opts.output);
    return code;
  };