import parse from 'esprima-the-party'
module fs from 'fs'
module path from 'path'
module ast from './ast'
import generate from 'escodegen'

export class CompileError extends Error {
  constructor(message) {
    this.name = 'CompileError'
    this.message = message
  }
}

var CODEGEN_FORMAT = { indent: { style: '  ' } }

var readdirFiles = dir =>
  fs.readdirSync(dir)
    .map(f => path.join(dir, f))
    .filter(f => ! fs.statSync(f).isDirectory())

function recursiveReaddir(dir) {
  var files = []
  fs.readdirSync(dir).forEach(child => {
    child = path.join(dir, child)
    if (fs.statSync(child).isDirectory())
      files = files.concat(recursiveReaddir(child))
    else
      files.push(child)
  })
  return files
}

/// Compile source file into ast
/// @param sourcePath Where to find source file.
/// @param opts Compilation options
/// @retval AST
function parseSourceFile(sourcePath, opts) {
  var contents = fs.readFileSync(sourcePath).toString()
  var ast = parse(contents, {
    loc: ! opts.withoutLocs,
    source: sourcePath
  })

  return ast
}

function argumentsToSources(args, opts) {
  // map of script file name against ast
  var sources = []

  // regexp when scanning directories
  var sourceRe = opts.compile ? /\.es6$/ : /\.(es6|js)$/

  args.forEach(arg => {
    if (fs.statSync(arg).isDirectory()) {
      // arg is directory containing source paths
      var dirFiles = opts.dontRecurse ?
        readdirFiles(arg) :
        recursiveReaddir(arg)

      dirFiles.forEach(sourcePath => {
        if (sourceRe.test(sourcePath)) {
          sources.push({
            path: sourcePath,
            ast: parseSourceFile(sourcePath, opts),
            dirArg: arg
          })
        }
      })
    }
    else {
      // arg is path to source file
      sources.push({
        path: arg,
        ast: parseSourceFile(arg, opts)
      })
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
/// @param objects Object of form { sourcePath: { code, map } }
/// @param targetDir Directory that will hold output files.
function outputObjects(objects, targetDir) {
  Object.keys(objects).forEach(objectModule => {
    var object = objects[objectModule]

    var destPath = path.join(targetDir, objectModule + ".js")

    if (destPath === object.sourcePath) {
      console.error('Source file equals output file for', destPath, 'skipping.')
    }
    else {
      mkpath(path.dirname(destPath))

      if (object.map)
        fs.writeFileSync(destPath + '.map', object.map)
      fs.writeFileSync(destPath, object.code)
    }
  })
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
    return generate(compiledAst, { format: CODEGEN_FORMAT })
  }

  var sources = argumentsToSources(arg, opts)

  if (opts.dumpSources)
    return sources

  var objects = compileSources(sources, opts)

  if (opts.dump)
    return objects

  Object.keys(objects).forEach(objectModule => {
    var output, object = objects[objectModule], ast = object.ast

    if (opts.sourceMaps) {
      var tmp = generate(ast, {
        sourceMapWithCode: true,
        sourceMap: true, // from loc.source
        format: CODEGEN_FORMAT
      })
      object.map = tmp.map
      object.code = tmp.code
    }
    else {
      object.code = generate(ast)
    }
  })

  if (opts.output)
    outputObjects(objects, opts.output)

  return objects
}

/// Compile asts
/// @param sources [ { { path, ast, dir} }* ]
/// @param objects Optional existing objects hash in which to store
///                objects created from sources
/// @retval { sourcePath: { ast, dirArg, requires: [require]*, deps: [dep]* } }*
/// @todo Load extra modules as they are imported
function compileSources(sources, opts, objects) {
  if (! objects)
    objects = {}

  /// Compile AST and put result in objects[objectModule]
  var compileSource = (objectModule, source) => {
    var object = objects[objectModule] = {
      dirArg: source.dirArg,
      sourcePath: source.path,
      requires: []
    }

    // store this property for translators to set dependencies
    object.ast = ast.compileObject(object, source.ast)
    object.deps = object.requires.map(req => resolveModule(objectModule, req))
  }

  sources.forEach(source => {
    var sourcePath = source.path
    var objectModule = sourcePath.replace(/\.(js|es6)/, '')

    var dirArg = source.dirArg
    if (dirArg && ! opts.compile)
      // remove passed directory component from output path
      objectModule = objectModule.substr(dirArg.length + 1)

    compileSource(objectModule, source)
  })

  // Resolve file path of depModule according to path information stored
  // in object.
  var resolveDep = (depModule, object) => {
  }

  if (opts.outputFile) {
    // then also parse and generate code for dependencies
    Object.keys(objects).forEach(objectModule => {
      var object = objects[objectModule]
      object.deps.forEach(depModule => {
        // TODO:
        // if (dep isn't in objects) {
        //   var path = resolveDepPath(depModule, object)
        //   var depSource = {
        //     path,
        //     ast: parseSourceFile(depPath, opts)
        //   }
        //   compileSource(depModule, depSource)
        // }
      })
      // TODO: transitive dependencies
    })
  }

  return objects
}

function baseModule(mod) {
  if (mod === '')
    return '..'

  var lastSlash = mod.lastIndexOf('/')
  return lastSlash === -1 ?  '' : mod.substr(0, lastSlash)
}

function resolveModule(current, mod) {
  var ret = baseModule(current)

  mod.split('/').forEach(function (component) {
    if (component == '..') {
      ret = baseModule(ret)
    }
    else if (component !== '.') {
      if (ret.length)
        ret += '/'
      ret += component
    }
  })
  return ret
}
