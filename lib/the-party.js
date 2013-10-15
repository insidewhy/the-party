var $$$2 = require('./objects'), Objects = $$$2.Objects, CODEGEN_FORMAT = $$$2.CODEGEN_FORMAT;
var argumentsToSources = require('./parser').argumentsToSources;
var parse = require('esprima-the-party').parse;
var ast = require('./ast');
var generate = require('escodegen').generate;
var UsageError = exports.UsageError = function () {
    function UsageError(message) {
      this.name = 'UsageError';
      this.message = message;
    }
    UsageError.prototype = Object.create(Error.prototype, { constructor: { value: UsageError } });
    return UsageError;
  }();
var compile = exports.compile = function (arg, opts) {
    if (!opts)
      opts = {};
    if (opts.compile) {
      if (opts.output) {
        throw new UsageError('compile: "compile" option not compatible with "output"');
      } else {
        opts.output = '.';
      }
    }
    if (opts.outputFile) {
      opts.dependencies = true;
      opts.bare = false;
    }
    opts.withoutLocs = (opts.dump || opts.dumpSources) && !opts.dumpLocs;
    if (typeof arg === 'string') {
      var compiledAst = ast.compileObjectNode(parse(arg));
      if (opts.output || opts.outputFile) {
        throw new UsageError('compile(string, { output/outputFile } currently not working.');
      }
      return generate(compiledAst, { format: CODEGEN_FORMAT });
    }
    var sources = argumentsToSources(arg, opts);
    if (opts.dumpSources)
      return sources;
    var objects = new Objects(opts);
    objects.compileSources(sources);
    if (opts.dependencies) {
      try {
        for (;;) {
          var newModules = objects.compileUnresolvedDeps();
          if (newModules.length === 0)
            break;
        }
      } catch (e) {
        throw UsageError(e.message);
      }
    }
    if (!opts.bare)
      objects.wrapBodiesInDefine();
    if (opts.dump)
      return objects.hash;
    if (opts.output)
      objects.output(opts.output);
    if (opts.outputFile)
      objects.outputFile(opts.outputFile);
    return objects;
  };