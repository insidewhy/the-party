var $$$2 = require('./objects'), JSObjects = $$$2.JSObjects, CODEGEN_FORMAT = $$$2.CODEGEN_FORMAT;
var argumentsToSources = require('./parser').argumentsToSources;
var parse = require('esprima-the-party').parse;
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
    if (opts.outputFile) {
      if (opts.output)
        throw new CompileError('--output and --output-file options conflict');
      opts.dependencies = true;
    }
    opts.withoutLocs = (opts.dump || opts.dumpSources) && !opts.dumpLocs;
    if (typeof arg === 'string') {
      var compiledAst = ast.compileObjectNode(parse(arg));
      if (opts.output || opts.outputFile) {
        throw new CompileError('compile(string, { output/outputFile } currently not working.');
      }
      return generate(compiledAst, { format: CODEGEN_FORMAT });
    }
    var sources = argumentsToSources(arg, opts);
    if (opts.dumpSources)
      return sources;
    var objects = new JSObjects(opts);
    objects.compileSources(sources);
    if (opts.dependencies) {
      try {
        for (;;) {
          var newModules = objects.compileUnresolvedDeps();
          if (newModules.length === 0)
            break;
        }
      } catch (e) {
        throw CompileError(e.message);
      }
    }
    if (opts.dump)
      return objects.hash;
    objects.buildSourceCodeFromAsts();
    if (opts.output)
      objects.output(opts.output);
    return objects;
  };