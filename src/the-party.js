import {JSObjects, CODEGEN_FORMAT} from './objects'
import argumentsToSources from './parser'

import parse from 'esprima-the-party'
module ast from './ast'
import generate from 'escodegen'

export class CompileError extends Error {
  constructor(message) {
    this.name = 'CompileError'
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
      console.error("--compile option used with --output, ignoring --compile")
      delete opts.compile
    }
    else {
      opts.output = '.'
    }
  }

  if (opts.output && opts.outputFile)
    throw new CompileError("--output and --output-file options conflict")

  opts.withoutLocs = (opts.dump || opts.dumpSources) && ! opts.dumpLocs

  if (typeof arg === 'string') {
    // arg = code to be compiled
    var compiledAst = ast.compileObjectNode(parse(arg))
    if (opts.output || opts.outputFile) {
      throw new CompileError(
        "compile(string, { output/outputFile } currently not working.")
    }

    return generate(compiledAst, { format: CODEGEN_FORMAT })
  }

  var sources = argumentsToSources(arg, opts)

  if (opts.dumpSources)
    return sources

  var objects = new JSObjects(opts)
  objects.parseSources(sources)

  if (opts.outputFile) {
    // for (;;) {
    var unresolvedDeps = objects.getUnresolvedDeps()
    //   if (unresolvedDeps.length === 0) break
    //  objects.buildSourceCodeFromAsts(unresolvedDeps)
    // }
  }

  if (opts.dump)
    return objects.hash

  objects.buildSourceCodeFromAsts()

  if (opts.output)
    objects.output(opts.output)

  return objects
}
