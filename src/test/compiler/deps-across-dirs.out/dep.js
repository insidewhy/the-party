var dep2 = require('./lib/dep2');
var first = exports.first = function () {
    return 1 + dep2.second();
  };