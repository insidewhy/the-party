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
      baseDir: source.baseDir,
      sourcePath: source.path,
      requires: []
    }

    // store this property for translators to set dependencies
    object.ast = compileObject(object, source.ast)
    object.deps = object.requires.map(req => resolveModule(objectModule, req))
  }


  /// Compile asts
  /// @param sources [ { { path, ast, dir} }* ]
  /// @retval { sourcePath: { ast, baseDir, requires: [require]*, deps: [dep]* } }*
  /// @todo Load extra modules as they are imported
  compileSources(sources) {
    /// Compile AST and put result in this.hash[objectModule]
    sources.forEach(source => {
      var sourcePath = source.path
      var objectModule = sourcePath.replace(/\.(js|es6)/, '')

      var baseDir = source.baseDir
      if (baseDir !== '.')
        // remove passed directory component from output path
        objectModule = objectModule.substr(baseDir.length + 1)

      this._parseSource(objectModule, source)
    })
  }

  /// Add objects to this.hash for all unresolved dependencies and
  /// return an array of the corresponding newly added objectModule entries
  /// in this.hash.
  compileUnresolvedDeps() {
    var ret = []
    // then also parse and generate code for dependencies
    Object.keys(this.hash).forEach(objectModule => {
      var object = this.hash[objectModule]
      object.deps.forEach(depModule => {
        if (! (depModule in this.hash)) {
          var path = resolveDepPath(depModule, object)
          if (! path)
            throw Error("Could not find dependency module " + depModule)

          this._parseSource(depModule, {
            path,
            ast: parseSourceFile(path, this.opts),
            baseDir: object.baseDir
          })
          ret.push(depModule)
        }
      })
    })

    return ret
  }

  /// Generate map/code entries for object.
  _buildSourceCodeFromAst(object) {
    if (this.opts.sourceMaps) {
      var tmp = generate(object.ast, {
        sourceMapWithCode: true,
        sourceMap: true, // from loc.source
        format: CODEGEN_FORMAT
      })
      object.map = tmp.map
      object.code = tmp.code
    }
    else {
      object.code = generate(object.ast)
    }
  }

  wrapBodiesInDefine() {
    Object.keys(this.hash).forEach(objectModule => {
      var ast = this.hash[objectModule].ast
      var oldBody = ast.body
      ast.body = [ {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "define" },
          arguments: [
            {
              type: "Literal",
              value: objectModule,
              raw: "'" + objectModule + "'"
            },
            {
              type: "FunctionExpression",
              id: null,
              params: [
                { type: "Identifier", name: "require" },
                { type: "Identifier", name: "exports" }
              ],
              defaults: [],
              body: {
                type: "BlockStatement",
                body: oldBody
              },
              rest: null,
              generator: false,
              expression: false
            }
          ]
        }
      } ]
    })
  }

  /// Output many code files to the given output directory.
  /// @param targetDir Directory that will hold output files.
  output(targetDir) {
    Object.keys(this.hash).forEach(objectModule => {
      var object = this.hash[objectModule]
      this._buildSourceCodeFromAst(object)

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

  /// Compile all objects together into a single output file.
  outputFile(file) {
    // Make combined AST according to dependency order
    // var ast = {
    //   type: 'Program',
    //   // TODO: first comes the "header" including define
    //   body: []
    // }

    var header =
      path.join(path.dirname(fs.realpathSync(__filename)), 'define.js')

    var ast = parseSourceFile(header, { withoutLocs: true })

    var generateModule = objectModule => {
      var object = this.hash[objectModule]
      if (! object.generated) {
        object.generated = true
        object.deps.forEach(generateModule)

        // TODO: put inside define() wrapper
        ast.body = ast.body.concat(object.ast.body)
      }
    }

    Object.keys(this.hash).forEach(generateModule)

    var object = { ast }
    this._buildSourceCodeFromAst(object)

    mkpath(path.dirname(file))
    if (object.map)
      fs.writeFileSync(file + '.map', object.map)
    fs.writeFileSync(file, object.code)
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
  var base = path.join(object.baseDir, depModule)
  var test = file =>
    fs.existsSync(file) && fs.statSync(file).isFile() ? file : null

  var file = test(base + ".es6")
  if (file)
    return file
  else
    return test(base + ".js")
}
