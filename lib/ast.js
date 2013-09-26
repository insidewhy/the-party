var compile = require('./compile')

// Tree walking stuff
function compileNode(node) {
  if (node instanceof Array) {
    var out = []
    out.length = node.length
    node.forEach(function (v, i) {
      out[i] = compileNode(v)
    })
    return out
  }
  else if (typeof node === 'object') {
    return node === null ? null : compileObjectNode(node)
  }
  else {
    return node
  }
}

function compileObjectNode(ast) {
  var out = {}

  switch (ast.type) {
    case 'ModuleDeclaration':
      return compile.moduleAlias(ast)

    default:
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
exports.compile = function(asts) {
  var compiled = {}
  Object.keys(asts).forEach(function(key) {
    var val = asts[key]
    compiled[key] = compileObjectNode(val)
  })

  return compiled
}
