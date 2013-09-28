function raw(str) { return "'" + str + "'" }

// %s/"\([^" ]*\)": /\1: /g

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

/// Compile rest params
/// @param ast Ast of function that contains the rest parameter (it's body
///            has to be altered).
var compileRestParams = ast => {
  var rest = ast.rest, nParams = ast.params.length

  var sliceArgs = [{
    type: "Identifier",
    name: "arguments",
    loc: rest.loc
  }]
  if (nParams > 0) {
    sliceArgs.push({
      type: "Literal",
      value: nParams,
      raw: nParams.toString(),
      loc: rest.loc
    })
  }

  ast.body.body.unshift({
    type: "VariableDeclaration",
    declarations: [
      {
        type: "VariableDeclarator",
        id: {
          type: "Identifier",
          name: rest.name,
          loc: rest.loc
        },
        init: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            computed: false,
            object: {
              type: "MemberExpression",
              computed: false,
              object: {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "Identifier",
                  name: "Array",
                  loc: rest.loc
                },
                property: {
                  type: "Identifier",
                  name: "prototype",
                  loc: rest.loc
                },
                loc: rest.loc
              },
              property: {
                type: "Identifier",
                name: "slice",
                loc: rest.loc
              },
              loc: rest.loc
            },
            property: {
              type: "Identifier",
              name: "call",
              loc: rest.loc
            },
            loc: rest.loc
          },
          arguments: sliceArgs,
          loc: rest.loc
        },
        loc: rest.loc
      }
    ],
    kind: "var",
    loc: rest.loc
  })
}

var functionHelper = (ast, compile) => {
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

  if (ast.rest)
    compileRestParams(ast)

  return ast
}

/// The AST for this is already appropriate
exports.Property = ast => {
  ast.shorthand = false
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
