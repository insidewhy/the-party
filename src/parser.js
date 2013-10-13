module fs from 'fs'
module path from 'path'
import parse from 'esprima-the-party'

/// Compile source file into ast
/// @param sourcePath Where to find source file.
/// @param opts Compilation options
/// @retval AST
export function parseSourceFile(sourcePath, opts) {
  var contents = fs.readFileSync(sourcePath).toString()
  var ast = parse(contents, {
    loc: ! opts.withoutLocs,
    source: sourcePath
  })

  return ast
}

export function argumentsToSources(args, opts) {
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
