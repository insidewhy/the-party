// %s/"\([^" ]*\)": /\1: /g

// utility stuff {
function raw(str) { return "'" + str + "'" }

var __uniqueId = 0
/// Make a unique Id
function uniqueId(loc) {
  return {
    type: "Identifier",
    name: "$$$" + (++__uniqueId).toString(36),
    loc
  }
}
// } end utility stuff

// modules {
/// Mutates harmony module alias ast into es5 ast
export function ExportDeclaration(ast, compile) {
  var declaration = ast.declaration
  var loc, ret, haveCompiled = false

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
  else if (declaration.type === 'ClassDeclaration') {
    // compile to VariableDeclaration then also handled by next if
    declaration = ClassDeclaration(declaration, compile)
    haveCompiled = true
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
        right: haveCompiled ? prevInit : compile(prevInit),
        loc
      }
    })

    return declaration
  }
  else {
    return ast
  }
}

function addRequire(requires, path) {
  // Ignore 'blah' dependencies (from node_modules etc.)
  if (path[0] === '.')
    requires.push(path)
}

export function ModuleDeclaration(ast, compile) {
  if (compile.object)
    addRequire(compile.object.requires, ast.source.value)

  var loc = ast.loc
  return {
    type: "VariableDeclaration",
    declarations: [{
      type: "VariableDeclarator",
      id: ast.id,
      init: {
        type: "CallExpression",
        callee: { type: "Identifier", name: "require", loc },
        arguments: [ ast.source ],
        loc
      },
      loc
    }],
    kind: "var",
    loc
  }
}

export function ImportDeclaration(ast, compile) {
  if (compile.object)
    addRequire(compile.object.requires, ast.source.value)

  var loc = ast.loc

  var requireExpression = {
    type: "CallExpression",
    callee: { type: "Identifier", name: "require", loc },
    arguments: [ ast.source ],
    loc
  }

  var moduleSrc, declarations = [ ]
  if (ast.specifiers.length === 1) {
    moduleSrc = requireExpression
  }
  else {
    var id = uniqueId(loc)
    moduleSrc = id
    declarations[0] = {
      type: "VariableDeclarator", init: requireExpression, id, loc
    }
  }

  var ret = {
    type: "VariableDeclaration",
    declarations,
    kind: 'var',
    loc
  }

  ast.specifiers.forEach(specifier => {
    declarations.push({
      type: "VariableDeclarator",
      id: specifier.name || specifier.id,
      init: {
        type: "MemberExpression",
        computed: false,
        object: moduleSrc,
        property: specifier.id,
        loc
      }
    })
  })

  return ret
}
// } end modules

// patterns {
export function VariableDeclaration(ast, compile) {
  var id = ast.id,
      newDecls = [],
      loc

  var walkObjectPattern = (src, props) => {
    props.forEach(prop => {
      var loc = prop.loc, newDecl = {
        type: "VariableDeclarator",
        init: {
          type: "MemberExpression",
          computed: false,
          object: src,
          property: prop.key,
          loc
        }
      }

      var isObjectPattern = prop.value.type === 'ObjectPattern'
      if (isObjectPattern || prop.value.type === 'ArrayPattern') {
        // assign key to temporary id
        newDecl.id = uniqueId(loc)
        newDecls.push(newDecl)

        // then recurse into the pattern, assigning from the temporary id
        if (isObjectPattern)
          walkObjectPattern(newDecl.id, prop.value.properties)
        else
          walkArrayPattern(newDecl.id, prop.value.elements)
      }
      else {
        newDecl.id = prop.value
        newDecls.push(newDecl)
      }
    })
  }

  var walkArrayPattern = (src, elements) => {
    elements.forEach((element, idx) => {
      // skip "[ , ... ], just let idx increment
      if (element === null)
        return

      var loc = element.loc, newDecl = {
        type: "VariableDeclarator",
        init: {
          type: "MemberExpression",
          computed: true,
          object: src,
          property: {
            type: "Literal",
            value: idx,
            raw: idx.toString(),
            loc
          },
          loc
        },
        loc
      }

      var isObjectPattern = element.type === 'ObjectPattern'
      if (isObjectPattern || element.type === 'ArrayPattern') {
        newDecl.id = uniqueId(loc)
        newDecls.push(newDecl)
        // then recurse into the pattern, assigning from the temporary id
        if (isObjectPattern)
          walkObjectPattern(newDecl.id, element.properties)
        else
          walkArrayPattern(newDecl.id, element.elements)
      }
      // TODO: last: {  type: "SpreadElement", argument: { type: "Identifier", name } }
      else {
        newDecl.id = element
        newDecls.push(newDecl)
      }
    })
  }

  ast.declarations.forEach(decl => {
    var isObjectPattern = decl.id.type === 'ObjectPattern'
    if (isObjectPattern || decl.id.type === 'ArrayPattern') {
      var init = decl.init
      if (init.type !== 'Identifier') {
        loc = init.loc
        var id = uniqueId(loc)
        newDecls.push({
          type: "VariableDeclarator", id, init: compile(init), loc
        })

        // then use the alias as the init from here...
        init = id
      }

      if (isObjectPattern)
        walkObjectPattern(init, decl.id.properties)
      else
        walkArrayPattern(init, decl.id.elements)
    }
    else {
      decl.init = compile(decl.init)
      newDecls.push(decl)
    }
  })

  ast.declarations = newDecls

  return ast
}
// } end patterns

// functions {

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
      body: [{ type: "ReturnStatement", argument: compile(existing), loc }],
      loc
    }
    ast.expression = false
  }
  else {
    ast.body = compile(ast.body)
  }

  if (ast.rest) {
    compileRestParams(ast)
    // TODO: avoid potential double compilation maybe with below?
    // ast.rest = null
  }

  return ast
}

export var FunctionExpression = functionHelper,
           FunctionDeclaration = functionHelper

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

// } end functions

// objects {
/// The AST for this is already appropriate
export function Property(ast, compile) {
  ast.shorthand = false // { a } => { a: a }
  ast.method = false // { f() {} } => { f: function() {} }
  ast.value = compile(ast.value)
  return ast
}
// } end objects

// classes {
export function ClassExpression(ast, compile) {
  var id = ast.id, loc
  if (! id) {
    var loc = ast.loc
    // TODO: hmm
    id = { type: "Identifier", name: "Class", loc }
  }
  else {
    var loc = id.loc
  }

  // constructor body
  var classDefBody = [{
    type: "FunctionDeclaration",
    id,
    params: [],
    defaults: [],
    body: { type: "BlockStatement", body: [], loc },
    rest: null,
    generator: false,
    expression: false,
    loc
  }]

  var ret = {
    type: "CallExpression",
    callee: {
      type: "FunctionExpression",
      id: null,
      params: [],
      defaults: [],
      body: { type: "BlockStatement", body: classDefBody, loc },
      rest: null,
      generator: false,
      expression: false,
      loc
    },
    arguments: [],
    loc
  }

  var superClass = ast.superClass, bakSuperclass
  if (superClass) {
    // store superclass as property of compile function for access by
    // other AST translator functions (for use in super)
    bakSuperclass = compile.superClass
    compile.superClass = superClass

    // Inject this code at the beginning of the scope that creates the class:
    //    Class.prototype = Object.create(${superClass}.prototype, {
    //      constructor: { value: Class }
    //    })
    classDefBody.push({
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          computed: false,
          object: id,
          property: { type: "Identifier", name: "prototype", loc }
        },
        right: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            computed: false,
            object: { type: "Identifier", name: "Object", loc },
            property: { type: "Identifier", name: "create", loc }
          },
          arguments: [
            {
              type: "MemberExpression",
              computed: false,
              object: superClass,
              property: { type: "Identifier", name: "prototype", loc }
            },
            {
              type: "ObjectExpression",
              properties: [ {
                type: "Property",
                key: { type: "Identifier", name: "constructor", loc },
                value: {
                  type: "ObjectExpression",
                  properties: [ {
                    type: "Property",
                    key: { type: "Identifier", name: "value", loc },
                    value: id,
                    kind: "init",
                    method: false,
                    shorthand: false,
                    loc
                  } ]
                },
                kind: "init",
                method: false,
                shorthand: false,
                loc
              } ],
              loc
            }
          ]
        }, // end right
        loc
      },
      loc
    })
  }

  ast.body.body.forEach(clssMemb => {
    if (clssMemb.type === 'MethodDefinition') {
      if (clssMemb.key.name === 'constructor') {
        classDefBody[0].body = compile(clssMemb.value.body)
        classDefBody[0].params = clssMemb.value.params
      }
      else {
        var loc = clssMemb.key.loc
        classDefBody.push({
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "MemberExpression",
              computed: false,
              object: {
                type: "MemberExpression",
                computed: false,
                object: id,
                property: {
                  type: "Identifier",
                  name: "prototype",
                  loc
                },
                loc
              },
              property: clssMemb.key,
              loc
            },
            right: compile(clssMemb.value),
            loc
          },
          loc
        })
      }
    }
  })

  // restore backup now that methods have processed
  if (superClass)
    compile.superClass = bakSuperclass

  classDefBody.push({
    type: "ReturnStatement",
    argument: id,
    loc
  })

  return ret
}

export function ClassDeclaration(ast, compile) {
  var id = ast.id, loc = ast.id.loc
  return {
    type: "VariableDeclaration",
    declarations: [{
      type: "VariableDeclarator",
      id,
      init: ClassExpression(ast, compile),
      loc
    }],
    kind: "var",
    loc
  }
}

export function CallExpression(ast, compile) {
  var methodCall
  if (ast.callee.object && ast.callee.object.name === 'super')
    methodCall = ast.callee.property

  if (methodCall || ast.callee.name === 'super') {
    var loc = methodCall ? ast.callee.object.loc : ast.callee.loc

    if (! compile.superClass)
      throw Error("super without super class")

    ast.arguments = compile(ast.arguments)
    ast.arguments.unshift({ type: "ThisExpression", loc })
    var ret = {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        computed: false,
        property: { type: "Identifier", name: "call", loc }
      },
      arguments: ast.arguments,
      loc
    }

    if (methodCall) {
      ret.callee.object = {
        type: "MemberExpression",
        computed: false,
        object: {
          type: "MemberExpression",
          computed: false,
          object: compile.superClass,
          property: { type: "Identifier", name: "prototype", loc },
          loc
        },
        property: methodCall,
        loc
      }
    }
    else {
      ret.callee.object = compile.superClass
    }

    return ret
  }
  else {
    ast.arguments = compile(ast.arguments)
    ast.callee = compile(ast.callee)
    return ast
  }
}
// } end classes

// esprima bug work-around {
export function Literal(ast) {
  if (ast.value === {})
    ast.value = raw
  return ast
}
// }
