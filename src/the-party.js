import parse from 'esprima-the-party'
module fs from 'fs'
module path from 'path'
module ast from './ast'
import generate from 'escodegen'

var CODEGEN_FORMAT = { indent: { style: '  ' } }

function recursiveGlob(dir, pattern) {
  var files = []
  fs.readdirSync(dir).forEach(child => {
    child = path.join(dir, child)
    if (fs.statSync(child).isDirectory())
      files = files.concat(recursiveGlob(child, pattern))
    else if (pattern.test(child))
      files.push(child)
  })
  return files
}

function parseScripts(sourcePaths, opts) {
  var noLocs = (opts.dump || opts.dumpSources) && ! opts.dumpLocs

  // map of script file name against ast
  var sources = {}

  var parseSourceFile = (sourcePath, dir) => {
    var contents = fs.readFileSync(sourcePath).toString()
    var ast = parse(contents, {
      loc: ! noLocs,
      source: sourcePath
    })

    sources[sourcePath] = { ast, dir }
  }

  // regexp when scanning directories
  var sourceRe = opts.compile ? /\.es6$/ : /\.(es6|js)$/

  sourcePaths.forEach(sourcePath => {
    if (fs.statSync(sourcePath).isDirectory()) {
      recursiveGlob(sourcePath, sourceRe).forEach(file => {
        parseSourceFile(file, opts.compile ? null : sourcePath)
      })
    }
    else {
      parseSourceFile(sourcePath, null)
    }
  })

  return sources
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

    // remove passed directory component from output path
    if (compiled.sourceDir)
      sourcePath = sourcePath.substr(compiled.sourceDir.length)

    var destPath = path.join(targetDir, sourcePath)
    destPath = destPath.replace(/\.es6$/, '.js')

    if (destPath === sourcePath) {
      console.error('Source file equals output file for', destPath, 'skipping.')
    }
    else {
      mkpath(path.dirname(destPath))

      if (compiled.map)
        fs.writeFileSync(destPath + '.map', compiled.map)
      fs.writeFileSync(destPath, compiled.code)
    }
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
    var compiledAst = ast.compileObjectNode(parse(scripts))
    return generate(compiledAst, { format: CODEGEN_FORMAT })
  }

  var sources = parseScripts(scripts, opts)

  if (opts.dumpSources)
    return sources

  var objects = ast.compile(sources)

  if (opts.dump)
    return objects

  var code = {}
  Object.keys(objects).forEach(sourcePath => {
    var output, object = objects[sourcePath], ast = object.ast

    var codeEntry = {}
    if (opts.sourceMaps) {
      var tmp = generate(ast, {
        sourceMapWithCode: true,
        sourceMap: true, // from loc.source
        format: CODEGEN_FORMAT
      })
      codeEntry.map = tmp.map
      codeEntry.code = tmp.code
    }
    else {
      codeEntry.code = generate(ast)
    }
    codeEntry.sourceDir = object.sourceDir
    code[sourcePath] = codeEntry
  })

  if (opts.output)
    outputCode(code, opts.output)

  return code
}
