function raw(str) {
  return '\'' + str + '\'';
}
exports.ModuleDeclaration = function (ast) {
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
            loc: ast.loc
          },
          arguments: [ast.source]
        }
      }],
    kind: 'var',
    loc: ast.loc
  };
}.bind(this);
var compileRestParams = function (ast) {
    var rest = ast.rest, nParams = ast.params.length;
    var sliceArgs = [{
          type: 'Identifier',
          name: 'arguments',
          loc: rest.loc
        }];
    if (nParams > 0) {
      sliceArgs.push({
        type: 'Literal',
        value: nParams,
        raw: nParams.toString(),
        loc: rest.loc
      });
    }
    ast.body.body.unshift({
      type: 'VariableDeclaration',
      declarations: [{
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: rest.name,
            loc: rest.loc
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
                    loc: rest.loc
                  },
                  property: {
                    type: 'Identifier',
                    name: 'prototype',
                    loc: rest.loc
                  },
                  loc: rest.loc
                },
                property: {
                  type: 'Identifier',
                  name: 'slice',
                  loc: rest.loc
                },
                loc: rest.loc
              },
              property: {
                type: 'Identifier',
                name: 'call',
                loc: rest.loc
              },
              loc: rest.loc
            },
            arguments: sliceArgs,
            loc: rest.loc
          },
          loc: rest.loc
        }],
      kind: 'var',
      loc: rest.loc
    });
  }.bind(this);
var functionHelper = function (ast, compile) {
    if (ast.expression) {
      var existing = ast.body;
      ast.body = {
        type: 'BlockStatement',
        body: [{
            type: 'ReturnStatement',
            argument: existing,
            loc: existing.loc
          }],
        loc: existing.loc
      };
      ast.expression = false;
    } else {
      ast.body = compile(ast.body);
    }
    if (ast.rest)
      compileRestParams(ast);
    return ast;
  }.bind(this);
exports.Property = function (ast, compile) {
  ast.shorthand = false;
  ast.method = false;
  ast.value = compile(ast.value);
  return ast;
}.bind(this);
exports.FunctionExpression = exports.FunctionDeclaration = functionHelper;
exports.ArrowFunctionExpression = function (ast, compile) {
  ast.type = 'FunctionExpression';
  return {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: exports.FunctionExpression(ast, compile),
      property: {
        type: 'Identifier',
        name: 'bind',
        loc: ast.loc
      },
      loc: ast.loc
    },
    arguments: [{
        type: 'ThisExpression',
        loc: ast.loc
      }],
    loc: ast.loc
  };
}.bind(this);