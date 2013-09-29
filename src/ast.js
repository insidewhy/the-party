module codegen from './codegen'

// Tree walking stuff
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
  var handler = codegen[ast.type]
  if (handler) {
    return handler(ast, compileNode)
  }
  else {
    var out = {}
    for (var k in ast) {
      if (k === 'range')
        out[k] = ast[k]
      else
        out[k] = compileNode(ast[k])
    }
    return out
  }
}

/// Compile asts
/// @param asts { file: ast }*
/// @retval { file: compiled_ast }*
/// @todo Load extra modules as they are imported
export function compile(asts) {
  var compiled = {}
  Object.keys(asts).forEach(key => {
    compiled[key] = compileObjectNode(asts[key])
  })

  return compiled
}
