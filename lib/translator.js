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
var ModuleDeclaration = exports.ModuleDeclaration = function (ast) {
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
var ImportDeclaration = exports.ImportDeclaration = function (ast) {
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
      var newDecl = {
          type: 'VariableDeclarator',
          init: {
            type: 'MemberExpression',
            computed: false,
            object: moduleSrc,
            property: specifier.id,
            loc: loc
          }
        };
      newDecl.id = specifier.name || specifier.id;
      declarations.push(newDecl);
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
            argument: existing,
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