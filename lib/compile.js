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