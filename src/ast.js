module translator from './translator'

// Tree walking stuff
// The compileNode function also stores the current context as attributes
function compileNode(node) {
  if (node instanceof Array) {
    var out = []
    out.length = node.length
    node.forEach((v, i) => { out[i] = compileNode(v) })
    return out
  }
  else if (typeof node === 'object') {
    return node === null ? null : compileObjectNode(node)
  }
  else {
    return node
  }
}

export function compileObjectNode(ast) {
  var handler = translator[ast.type]
  if (handler) {
    return handler(ast, compileNode)
  }
  else {
    var out = {}
    for (var k in ast) {
      if (k === 'loc')
        out.loc = ast.loc
      else
        out[k] = compileNode(ast[k])
    }
    return out
  }
}

/// Compile asts
/// @param asts { file: ast }*
/// @retval { sourcePath: { ast: <compiled ast>, sourceDir } }*
/// @todo Load extra modules as they are imported
export function compile(sources, opts) {
  compileNode.options = opts

  var objects = {}
  Object.keys(sources).forEach(key => {
    var source = sources[key]
    objects[key] = {
      sourceDir: source.dir,
      ast: compileObjectNode(source.ast)
    }
  })

  return objects
}
