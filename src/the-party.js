import {Objects, CODEGEN_FORMAT} from './objects'
import argumentsToSources from './parser'

import parse from 'esprima-the-party'
module ast from './ast'
import generate from 'escodegen'

export class UsageError extends Error {
  constructor(message) {
    this.name = 'UsageError'
    this.message = message
  }
}

/// Compiles scripts/directories (or script data)
/// @param arg This can be an array of form { path: ast } or a string containing ES6 code.
/// @param opts An object containing the following options:
//      dump: If set then the return object will contain AST dumps of the compled code as the values instead of the code as string
//      dumpSources: Like dump but the values will be ASTs of the source objects.
//      dumpLocs: When dump or dumpSources is set then location data is removed from the AST unless this parameter is used.
///
/// @retval Data of the form { sourcePath: code } where code can be an AST (if dumpSources or dump was set) or an object of the form { map, code }
export function compile(arg, opts) {
  // output overrides compile
  if (! opts)
    opts = {}

  if (opts.compile) {
    if (opts.output) {
      throw new UsageError(
        'compile: "compile" option not compatible with "output"')
    }
    else {
      opts.output = '.'
    }
  }

  if (opts.outputFile) {
    opts.dependencies = true
    opts.bare = false
  }

  opts.withoutLocs = (opts.dump || opts.dumpSources) && ! opts.dumpLocs

  if (typeof arg === 'string') {
    // arg = code to be compiled
    var compiledAst = ast.compileObjectNode(parse(arg))
    if (opts.output || opts.outputFile) {
      throw new UsageError(
        "compile(string, { output/outputFile } currently not working.")
    }

    return generate(compiledAst, { format: CODEGEN_FORMAT })
  }

  var sources = argumentsToSources(arg, opts)

  if (opts.dumpSources)
    return sources

  var objects = new Objects(opts)
  objects.compileSources(sources)

  if (opts.dependencies) {
    try {
      for (;;) {
        var newModules = objects.compileUnresolvedDeps()
        if (newModules.length === 0)
          break
      }
    }
    catch (e) {
      throw UsageError(e.message)
    }
  }

  if (! opts.bare)
    objects.wrapBodiesInDefine()

  if (opts.dump)
    return objects.hash

  if (opts.output)
    objects.output(opts.output)

  if (opts.outputFile)
    objects.outputFile(opts.outputFile)

  return objects
}
