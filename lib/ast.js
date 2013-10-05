var translator = require('./translator');
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
    var handler = translator[ast.type];
    if (handler) {
      return handler(ast, compileNode);
    } else {
      var out = {};
      for (var k in ast) {
        if (k === 'loc')
          out.loc = ast.loc;
        else
          out[k] = compileNode(ast[k]);
      }
      return out;
    }
  };
var compile = exports.compile = function (sources) {
    var objects = {};
    Object.keys(sources).forEach(function (key) {
      var source = sources[key];
      objects[key] = {
        sourceDir: source.dir,
        ast: compileObjectNode(source.ast)
      };
    }.bind(this));
    return objects;
  };