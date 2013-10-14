var dep3 = require('./dep3');
var second = exports.second = function () {
    return 2 + dep3.third();
  };