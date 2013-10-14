var dep = require('./dep');
GLOBAL.main = function () {
  return dep.first();
};