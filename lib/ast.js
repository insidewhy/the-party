var codegen = require('./codegen');
function compileNode(node) {
  if (node instanceof Array) {
    var out = [];
    out.length = node.length;
    node.forEach(function (v, i) {
      out[i] = compileNode(v);
    }.bind(this));
    return out;
  } else if (typeof node === 'object') {
    return node === null ? null : compileObjectNode(node);
  } else {
    return node;
  }
}
var compileObjectNode = exports.compileObjectNode = function (ast) {
    var handler = codegen[ast.type];
    if (handler) {
      return handler(ast, compileNode);
    } else {
      var out = {};
      for (var k in ast) {
        if (k === 'range')
          out[k] = ast[k];
        else
          out[k] = compileNode(ast[k]);
      }
      return out;
    }
  };
var compile = exports.compile = function (asts) {
    var compiled = {};
    Object.keys(asts).forEach(function (key) {
      compiled[key] = compileObjectNode(asts[key]);
    }.bind(this));
    return compiled;
  };