function raw(str) {
  return '\'' + str + '\'';
}
var __uniqueId = 0;
function uniqueId(loc) {
  return {
    type: 'Identifier',
    name: '$$$' + (++__uniqueId).toString(36),
    loc: loc
  };
}
var ExportDeclaration = exports.ExportDeclaration = function (ast, compile) {
    var declaration = ast.declaration;
    var loc, ret;
    if (declaration.type === 'FunctionDeclaration') {
      var funcExpression = declaration, id = funcExpression.id;
      funcExpression.id = null;
      funcExpression.type = 'FunctionExpression';
      loc = funcExpression.loc;
      declaration = {
        type: 'VariableDeclaration',
        declarations: [{
            type: 'VariableDeclarator',
            id: id,
            init: funcExpression,
            loc: loc
          }],
        kind: 'var',
        loc: loc
      };
    } else if (declaration.type === 'ClassDeclaration') {
      declaration = ClassDeclaration(declaration, compile);
    }
    if (declaration.type === 'VariableDeclaration') {
      declaration.declarations.forEach(function (decl) {
        loc = decl.loc;
        var prevInit = decl.init;
        decl.init = {
          type: 'AssignmentExpression',
          operator: '=',
          left: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: 'exports',
              loc: loc
            },
            property: decl.id,
            loc: loc
          },
          right: compile(prevInit),
          loc: loc
        };
      }.bind(this));
      return declaration;
    } else {
      return ast;
    }
  };
function addRequire(requires, path) {
  if (path[0] === '.')
    requires.push(path);
}
var ModuleDeclaration = exports.ModuleDeclaration = function (ast, compile) {
    if (compile.object)
      addRequire(compile.object.requires, ast.source.value);
    var loc = ast.loc;
    return {
      type: 'VariableDeclaration',
      declarations: [{
          type: 'VariableDeclarator',
          id: ast.id,
          init: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'require',
              loc: loc
            },
            arguments: [ast.source],
            loc: loc
          },
          loc: loc
        }],
      kind: 'var',
      loc: loc
    };
  };
var ImportDeclaration = exports.ImportDeclaration = function (ast, compile) {
    if (compile.object)
      addRequire(compile.object.requires, ast.source.value);
    var loc = ast.loc;
    var requireExpression = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'require',
          loc: loc
        },
        arguments: [ast.source],
        loc: loc
      };
    var moduleSrc, declarations = [];
    if (ast.specifiers.length === 1) {
      moduleSrc = requireExpression;
    } else {
      var id = uniqueId(loc);
      moduleSrc = id;
      declarations[0] = {
        type: 'VariableDeclarator',
        init: requireExpression,
        id: id,
        loc: loc
      };
    }
    var ret = {
        type: 'VariableDeclaration',
        declarations: declarations,
        kind: 'var',
        loc: loc
      };
    ast.specifiers.forEach(function (specifier) {
      declarations.push({
        type: 'VariableDeclarator',
        id: specifier.name || specifier.id,
        init: {
          type: 'MemberExpression',
          computed: false,
          object: moduleSrc,
          property: specifier.id,
          loc: loc
        }
      });
    }.bind(this));
    return ret;
  };
var VariableDeclaration = exports.VariableDeclaration = function (ast, compile) {
    var id = ast.id, newDecls = [], loc;
    var walkObjectPattern = function (src, props) {
        props.forEach(function (prop) {
          var loc = prop.loc, newDecl = {
              type: 'VariableDeclarator',
              init: {
                type: 'MemberExpression',
                computed: false,
                object: src,
                property: prop.key,
                loc: loc
              }
            };
          var isObjectPattern = prop.value.type === 'ObjectPattern';
          if (isObjectPattern || prop.value.type === 'ArrayPattern') {
            newDecl.id = uniqueId(loc);
            newDecls.push(newDecl);
            if (isObjectPattern)
              walkObjectPattern(newDecl.id, prop.value.properties);
            else
              walkArrayPattern(newDecl.id, prop.value.elements);
          } else {
            newDecl.id = prop.value;
            newDecls.push(newDecl);
          }
        }.bind(this));
      }.bind(this);
    var walkArrayPattern = function (src, elements) {
        elements.forEach(function (element, idx) {
          if (element === null)
            return;
          var loc = element.loc, newDecl = {
              type: 'VariableDeclarator',
              init: {
                type: 'MemberExpression',
                computed: true,
                object: src,
                property: {
                  type: 'Literal',
                  value: idx,
                  raw: idx.toString(),
                  loc: loc
                },
                loc: loc
              },
              loc: loc
            };
          var isObjectPattern = element.type === 'ObjectPattern';
          if (isObjectPattern || element.type === 'ArrayPattern') {
            newDecl.id = uniqueId(loc);
            newDecls.push(newDecl);
            if (isObjectPattern)
              walkObjectPattern(newDecl.id, element.properties);
            else
              walkArrayPattern(newDecl.id, element.elements);
          } else {
            newDecl.id = element;
            newDecls.push(newDecl);
          }
        }.bind(this));
      }.bind(this);
    ast.declarations.forEach(function (decl) {
      var isObjectPattern = decl.id.type === 'ObjectPattern';
      if (isObjectPattern || decl.id.type === 'ArrayPattern') {
        var init = decl.init;
        if (init.type !== 'Identifier') {
          loc = init.loc;
          var id = uniqueId(loc);
          newDecls.push({
            type: 'VariableDeclarator',
            id: id,
            init: compile(init),
            loc: loc
          });
          init = id;
        }
        if (isObjectPattern)
          walkObjectPattern(init, decl.id.properties);
        else
          walkArrayPattern(init, decl.id.elements);
      } else {
        decl.init = compile(decl.init);
        newDecls.push(decl);
      }
    }.bind(this));
    ast.declarations = newDecls;
    return ast;
  };
var compileRestParams = function (ast) {
    var rest = ast.rest, nParams = ast.params.length;
    var loc = rest.loc;
    var sliceArgs = [{
          type: 'Identifier',
          name: 'arguments',
          loc: loc
        }];
    if (nParams > 0) {
      sliceArgs.push({
        type: 'Literal',
        value: nParams,
        raw: nParams.toString(),
        loc: loc
      });
    }
    ast.body.body.unshift({
      type: 'VariableDeclaration',
      declarations: [{
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: rest.name,
            loc: loc
          },
          init: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              computed: false,
              object: {
                type: 'MemberExpression',
                computed: false,
                object: {
                  type: 'MemberExpression',
                  computed: false,
                  object: {
                    type: 'Identifier',
                    name: 'Array',
                    loc: loc
                  },
                  property: {
                    type: 'Identifier',
                    name: 'prototype',
                    loc: loc
                  },
                  loc: loc
                },
                property: {
                  type: 'Identifier',
                  name: 'slice',
                  loc: loc
                },
                loc: loc
              },
              property: {
                type: 'Identifier',
                name: 'call',
                loc: loc
              },
              loc: loc
            },
            arguments: sliceArgs,
            loc: loc
          },
          loc: loc
        }],
      kind: 'var',
      loc: loc
    });
  }.bind(this);
var functionHelper = function (ast, compile) {
    if (ast.expression) {
      var existing = ast.body, loc = existing.loc;
      ast.body = {
        type: 'BlockStatement',
        body: [{
            type: 'ReturnStatement',
            argument: compile(existing),
            loc: loc
          }],
        loc: loc
      };
      ast.expression = false;
    } else {
      ast.body = compile(ast.body);
    }
    if (ast.rest)
      compileRestParams(ast);
    return ast;
  }.bind(this);
var FunctionExpression = exports.FunctionExpression = functionHelper, FunctionDeclaration = exports.FunctionDeclaration = functionHelper;
var ArrowFunctionExpression = exports.ArrowFunctionExpression = function (ast, compile) {
    ast.type = 'FunctionExpression';
    var loc = ast.loc;
    return {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: FunctionExpression(ast, compile),
        property: {
          type: 'Identifier',
          name: 'bind',
          loc: loc
        },
        loc: loc
      },
      arguments: [{
          type: 'ThisExpression',
          loc: loc
        }],
      loc: loc
    };
  };
var Property = exports.Property = function (ast, compile) {
    ast.shorthand = false;
    ast.method = false;
    ast.value = compile(ast.value);
    return ast;
  };
var ClassExpression = exports.ClassExpression = function (ast, compile) {
    var id = ast.id, loc;
    if (!id) {
      var loc = ast.loc;
      id = {
        type: 'Identifier',
        name: 'Class',
        loc: loc
      };
    } else {
      var loc = id.loc;
    }
    var classDefBody = [{
          type: 'FunctionDeclaration',
          id: id,
          params: [],
          defaults: [],
          body: {
            type: 'BlockStatement',
            body: [],
            loc: loc
          },
          rest: null,
          generator: false,
          expression: false,
          loc: loc
        }];
    var ret = {
        type: 'CallExpression',
        callee: {
          type: 'FunctionExpression',
          id: null,
          params: [],
          defaults: [],
          body: {
            type: 'BlockStatement',
            body: classDefBody,
            loc: loc
          },
          rest: null,
          generator: false,
          expression: false,
          loc: loc
        },
        arguments: [],
        loc: loc
      };
    var superClass = ast.superClass, bakSuperclass;
    if (superClass) {
      bakSuperclass = compile.superClass;
      compile.superClass = superClass;
      classDefBody.push({
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: '=',
          left: {
            type: 'MemberExpression',
            computed: false,
            object: id,
            property: {
              type: 'Identifier',
              name: 'prototype',
              loc: loc
            }
          },
          right: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              computed: false,
              object: {
                type: 'Identifier',
                name: 'Object',
                loc: loc
              },
              property: {
                type: 'Identifier',
                name: 'create',
                loc: loc
              }
            },
            arguments: [
              {
                type: 'MemberExpression',
                computed: false,
                object: superClass,
                property: {
                  type: 'Identifier',
                  name: 'prototype',
                  loc: loc
                }
              },
              {
                type: 'ObjectExpression',
                properties: [{
                    type: 'Property',
                    key: {
                      type: 'Identifier',
                      name: 'constructor',
                      loc: loc
                    },
                    value: {
                      type: 'ObjectExpression',
                      properties: [{
                          type: 'Property',
                          key: {
                            type: 'Identifier',
                            name: 'value',
                            loc: loc
                          },
                          value: id,
                          kind: 'init',
                          method: false,
                          shorthand: false,
                          loc: loc
                        }]
                    },
                    kind: 'init',
                    method: false,
                    shorthand: false,
                    loc: loc
                  }],
                loc: loc
              }
            ]
          },
          loc: loc
        },
        loc: loc
      });
    }
    ast.body.body.forEach(function (clssMemb) {
      if (clssMemb.type === 'MethodDefinition') {
        if (clssMemb.key.name === 'constructor') {
          classDefBody[0].body = compile(clssMemb.value.body);
          classDefBody[0].params = clssMemb.value.params;
        } else {
          var loc = clssMemb.key.loc;
          classDefBody.push({
            type: 'ExpressionStatement',
            expression: {
              type: 'AssignmentExpression',
              operator: '=',
              left: {
                type: 'MemberExpression',
                computed: false,
                object: {
                  type: 'MemberExpression',
                  computed: false,
                  object: id,
                  property: {
                    type: 'Identifier',
                    name: 'prototype',
                    loc: loc
                  },
                  loc: loc
                },
                property: clssMemb.key,
                loc: loc
              },
              right: compile(clssMemb.value),
              loc: loc
            },
            loc: loc
          });
        }
      }
    }.bind(this));
    if (superClass)
      compile.superClass = bakSuperclass;
    classDefBody.push({
      type: 'ReturnStatement',
      argument: id,
      loc: loc
    });
    return ret;
  };
var ClassDeclaration = exports.ClassDeclaration = function (ast, compile) {
    var id = ast.id, loc = ast.id.loc;
    return {
      type: 'VariableDeclaration',
      declarations: [{
          type: 'VariableDeclarator',
          id: id,
          init: ClassExpression(ast, compile),
          loc: loc
        }],
      kind: 'var',
      loc: loc
    };
  };
var CallExpression = exports.CallExpression = function (ast, compile) {
    var methodCall;
    if (ast.callee.object && ast.callee.object.name === 'super')
      methodCall = ast.callee.property;
    if (methodCall || ast.callee.name === 'super') {
      var loc = methodCall ? ast.callee.object.loc : ast.callee.loc;
      if (!compile.superClass)
        throw Error('super without super class');
      ast.arguments = compile(ast.arguments);
      ast.arguments.unshift({
        type: 'ThisExpression',
        loc: loc
      });
      var ret = {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            computed: false,
            property: {
              type: 'Identifier',
              name: 'call',
              loc: loc
            }
          },
          arguments: ast.arguments,
          loc: loc
        };
      if (methodCall) {
        ret.callee.object = {
          type: 'MemberExpression',
          computed: false,
          object: {
            type: 'MemberExpression',
            computed: false,
            object: compile.superClass,
            property: {
              type: 'Identifier',
              name: 'prototype',
              loc: loc
            },
            loc: loc
          },
          property: methodCall,
          loc: loc
        };
      } else {
        ret.callee.object = compile.superClass;
      }
      return ret;
    } else {
      ast.arguments = compile(ast.arguments);
      ast.callee = compile(ast.callee);
      return ast;
    }
  };
var Literal = exports.Literal = function (ast) {
    if (ast.value === {})
      ast.value = raw;
    return ast;
  };