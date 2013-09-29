function raw(str) { return "'" + str + "'" }

// %s/"\([^" ]*\)": /\1: /g

/// Mutates harmony module alias ast into es5 ast
export function ModuleDeclaration(ast) {
  var loc = ast.loc
  return {
    type: "VariableDeclaration",
    declarations: [{
      type: "VariableDeclarator",
      id: ast.id,
      init: {
        type: "CallExpression",
        callee: { type: "Identifier", name: "require", loc },
        arguments: [ ast.source ]
      }
    }],
    kind: "var",
    loc
  }
}

export function VariableDeclaration(ast, compile) {
  var id = ast.id
  var newDecls = []

  ast.declarations.forEach(decl => {
    if (decl.id.type === 'ObjectPattern') {
      if (decl.init.type !== 'Identifier') {
        // create a newDecl to alias init
      }

      decl.id.properties.forEach(prop => {
        // TODO: push declaration into newDecls for prop component
      })

      // var ret = {
      //   type: "VariableDeclarator",
      //   id: {
      //     type: "Identifier",
      //     name: "a"
      //   },
      //   init: {
      //     type: "MemberExpression",
      //     computed: false,
      //     object: {
      //       type: "Identifier",
      //       name: "o"
      //     },
      //     property: {
      //       type: "Identifier",
      //       name: "a"
      //     }
      //   }
      // }

      // TODO: erase me
      decl.init = compile(decl.init)
      newDecls.push(decl)
    }
    else {
      decl.init = compile(decl.init)
      newDecls.push(decl)
    }
  })

  return ast
}

/// Compile rest params
/// @param ast Ast of function that contains the rest parameter (it's body
///            has to be altered).
var compileRestParams = ast => {
  var rest = ast.rest, nParams = ast.params.length

  var loc = rest.loc
  var sliceArgs = [{ type: "Identifier", name: "arguments", loc }]
  if (nParams > 0) {
    sliceArgs.push({
      type: "Literal",
      value: nParams,
      raw: nParams.toString(),
      loc
    })
  }

  ast.body.body.unshift({
    type: "VariableDeclaration",
    declarations: [
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: rest.name, loc },
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
                object: { type: "Identifier", name: "Array", loc },
                property: { type: "Identifier", name: "prototype", loc },
                loc
              },
              property: { type: "Identifier", name: "slice", loc },
              loc
            },
            property: { type: "Identifier", name: "call", loc },
            loc
          },
          arguments: sliceArgs,
          loc
        },
        loc
      }
    ],
    kind: "var",
    loc
  })
}

var functionHelper = (ast, compile) => {
  if (ast.expression) {
    // "function a() b" -> "function a() { return b }"
    var existing = ast.body, loc = existing.loc
    ast.body = {
      type: "BlockStatement",
      body: [{ type: "ReturnStatement", argument: existing, loc }],
      loc
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

export var FunctionExpression = functionHelper,
           FunctionDeclaration = functionHelper

/// The AST for this is already appropriate
export function Property(ast, compile) {
  ast.shorthand = false // { a } => { a: a }
  ast.method = false // { f() {} } => { f: function() {} }
  ast.value = compile(ast.value)
  return ast
}

export function ArrowFunctionExpression(ast, compile) {
  ast.type = 'FunctionExpression'
  var loc = ast.loc

  // bind the function with this from the current scope
  return {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      computed: false,
      object: FunctionExpression(ast, compile),
      property: { type: "Identifier", name: "bind", loc },
      loc
    },
    arguments: [{ type: "ThisExpression", loc }],
    loc
  }
}

export function ExportDeclaration(ast, compile) {
  var declaration = ast.declaration
  var loc, ret

  // TODO if (declaration.type === 'ClassDeclaration') {

  if (declaration.type === 'FunctionDeclaration') {
    // converts function declaration to equivalent variable declaration of
    // function expression
    var funcExpression = declaration,
        id = funcExpression.id

    funcExpression.id = null
    funcExpression.type = 'FunctionExpression'

    loc = funcExpression.loc
    declaration = {
      type: "VariableDeclaration",
      declarations: [{
        type: "VariableDeclarator", id,
        init: funcExpression,
        loc
      }],
      kind: 'var',
      loc
    }
  }

  // May also act on a converted FunctionDeclaration
  if (declaration.type === 'VariableDeclaration') {
    declaration.declarations.forEach(decl => {
      loc = decl.loc
      var prevInit = decl.init
      decl.init =  {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          computed: false,
          object: { type: "Identifier", name: "exports", loc },
          property: decl.id,
          loc
        },
        right: compile(prevInit),
        loc
      }
    })

    return declaration
  }
  else {
    return ast
  }
}
