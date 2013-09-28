function raw(str) { return "'" + str + "'" }

// %s/"\([^]*\): /\1: /g

/// Mutates harmony module alias ast into es5 ast
exports.ModuleDeclaration = ast => {
  return {
    type: "VariableDeclaration",
    declarations: [
      {
        type: "VariableDeclarator",
        id: ast.id,
        init: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "require",
            loc: ast.loc
          },
          arguments: [ ast.source ]
        }
      }
    ],
    kind: "var",
    loc: ast.loc
  }
}

var functionHelper = (ast, compile) => {
  // TODO: support rest parameters
  if (ast.expression) {
    // "function a() b" -> "function a() { return b }"
    var existing = ast.body
    ast.body = {
      type: "BlockStatement",
      body: [{
        type: "ReturnStatement",
        argument: existing,
        loc: existing.loc
      }],
      loc: existing.loc
    }
    ast.expression = false
  }
  else {
    ast.body = compile(ast.body)
  }

  return ast
}

exports.FunctionExpression = exports.FunctionDeclaration = functionHelper

exports.ArrowFunctionExpression = (ast, compile) => {
  ast.type = 'FunctionExpression'

  return {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      computed: false,
      object: exports.FunctionExpression(ast, compile),
      property: {
        type: "Identifier",
        name: "bind",
        loc: ast.loc
      },
      loc: ast.loc
    },
    arguments: [{ type: "ThisExpression", loc: ast.loc }],
    loc: ast.loc
  }
}
