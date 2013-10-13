import compileObject from './ast'
import parseSourceFile from './parser'

module fs from 'fs'
module path from 'path'
import generate from 'escodegen'

export var CODEGEN_FORMAT = { indent: { style: '  ' } }

export class JSObjects {
  constructor(opts) {
    this.opts = opts
    this.hash = {} // hash of JSObject types on objectModule key
  }

  _parseSource(objectModule, source) {
    var object = this.hash[objectModule] = {
      dirArg: source.dirArg,
      sourcePath: source.path,
      requires: []
    }

    // store this property for translators to set dependencies
    object.ast = compileObject(object, source.ast)
    object.deps = object.requires.map(req => resolveModule(objectModule, req))
  }


  /// Compile asts
  /// @param sources [ { { path, ast, dir} }* ]
  /// @retval { sourcePath: { ast, dirArg, requires: [require]*, deps: [dep]* } }*
  /// @todo Load extra modules as they are imported
  parseSources(sources) {
    /// Compile AST and put result in this.hash[objectModule]
    sources.forEach(source => {
      var sourcePath = source.path
      var objectModule = sourcePath.replace(/\.(js|es6)/, '')

      var dirArg = source.dirArg
      if (dirArg && ! this.opts.compile)
        // remove passed directory component from output path
        objectModule = objectModule.substr(dirArg.length + 1)

      this._parseSource(objectModule, source)
    })
  }

  /// Add objects to this.hash for all unresolved dependencies and
  /// return an array of the corresponding newly added objectModule entries
  /// in this.hash.
  getUnresolvedDeps() {
    var ret = []
    // then also parse and generate code for dependencies
    Object.keys(this.hash).forEach(objectModule => {
      var object = this.hash[objectModule]
      object.deps.forEach(depModule => {
        // TODO:
        // if (dep isn't in this.hash) {
        //   var path = resolveDepPath(depModule, object)
        //   var depSource = {
        //     path,
        //     ast: parseSourceFile(depPath, this.opts)
        //   }
        //   this._parseSource(depModule, depSource)
        //   ret.push(depModule)
        // }
      })

    return []
      // TODO: transitive dependencies
    })
  }

  /// Populates map/code members of all objects in this.hash
  /// @param modules Optional modules override, if not given all current
  ///                modules are compiled.
  buildSourceCodeFromAsts(modules) {
    if (modules === undefined)
      modules = Object.keys(this.hash)

    modules.forEach(objectModule => {
      var output, object = this.hash[objectModule], ast = object.ast

      if (this.opts.sourceMaps) {
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
  }

  /// Output many code files to the given output directory.
  /// @param targetDir Directory that will hold output files.
  output(targetDir) {
    Object.keys(this.hash).forEach(objectModule => {
      var object = this.hash[objectModule]

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

function baseModule(mod) {
  if (mod === '')
    return '..'

  var lastSlash = mod.lastIndexOf('/')
  return lastSlash === -1 ?  '' : mod.substr(0, lastSlash)
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

// Resolve file path of depModule according to path information stored
// in object.
function resolveDepPath(depModule, object) {
}
