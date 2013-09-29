module esprima from 'esprima-the-party'
module fs from 'fs'
module path from 'path'
module ast from './ast'
module escodegen from 'escodegen'

var CODEGEN_FORMAT = { indent: { style: '  ' } }

function parseScripts(sourcePaths, noLocs) {
  // map of script file name against ast
  var asts = {}

  sourcePaths.forEach(sourcePath => {
    var contents = fs.readFileSync(sourcePath).toString()
    asts[sourcePath] = esprima.parse(contents, {
      loc: ! noLocs,
      source: sourcePath
    })
  })

  return asts
}

function mkpath(dir) {
  var mk = '' // path component so far (starting from head)
  dir.split(path.sep).forEach(component => {
    mk = path.join(mk, component)
    if (! fs.existsSync(mk) || ! fs.statSync(mk).isDirectory()) {
      if (fs.mkdirSync(mk)) {
        console.error("Could not make path component:", mk)
        process.exit(1)
      }
    }
  })
}

/// Output many code files to the given output directory.
/// @param compiledSources Object of form { sourcePath: { code, map } }
/// @param targetDir Directory that will hold output files.
function outputCode(compiledSources, targetDir) {
  Object.keys(compiledSources).forEach(sourcePath => {
    var compiled = compiledSources[sourcePath]
    var destPath = path.join(targetDir, sourcePath)
    mkpath(path.dirname(destPath))

    if (compiled.map)
      fs.writeFileSync(destPath + '.map', compiled.map)
    fs.writeFileSync(destPath, compiled.code)
  })
}

/// Compiles scripts (or script data)
/// @param scripts This can be an array of form { path: ast } or a string containing ES6 code.
/// @param An object containing the following options:
//      dump: If set then the return object will contain AST dumps of the compled code as the values instead of the code as string
//      dumpSources: Like dump but the values will be ASTs of the source objects.
//      dumpLocs: When dump or dumpSources is set then location data is removed from the AST unless this parameter is used.
///
/// @retval Data of the form { sourcePath: code } where code can be an AST (if dumpSources or dump was set) or an object of the form { map, code }
export function compile(scripts, opts) {
  if (typeof scripts === 'string') {
    // scripts = code to be compiled
    var compiledAst = ast.compileObjectNode(esprima.parse(scripts))
    return escodegen.generate(compiledAst, { format: CODEGEN_FORMAT })
  }

  var asts = parseScripts(scripts,
                          (opts.dump || opts.dumpSources) && ! opts.dumpLocs)

  if (opts.dumpSources)
    return asts

  var compiled = ast.compile(asts)

  if (opts.dump)
    return compiled

  var code = {}
  Object.keys(compiled).forEach(sourcePath => {
    var output, ast = compiled[sourcePath]
    var codeEntry = {}
    if (opts.sourceMaps) {
      var tmp = escodegen.generate(ast, {
        sourceMapWithCode: true,
        sourceMap: true, // from loc.source
        format: CODEGEN_FORMAT
      })
      codeEntry.map = tmp.map
      codeEntry.code = tmp.code
    }
    else {
      codeEntry.code = escodegen.generate(ast)
    }
    code[sourcePath] = codeEntry
  })

  if (opts.output)
    outputCode(code, opts.output)

  return code
}
