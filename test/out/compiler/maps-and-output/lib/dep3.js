var dep4 = require('../dep4');
var third = exports.third = function () {
    return 3 + dep4.fourth();
  };