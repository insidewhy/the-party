if (!define) {
  var define = function () {
      if (require) {
        var define = function (name, factory) {
          factory(require, exports);
        };
      } else {
        var modules = {}, require = function (relativePath) {
            var path = resolveModule(relativePath);
            return modules[path] || (modules[path] = {});
          }, currentModule = null, define = function (name, factory) {
            currentModuleBak = currentModule;
            currentModule = name;
            var exports = modules[name] || (modules[name] = {});
            factory(require, exports);
            currentModule = currentModuleBak;
          }, baseModule = function (mod) {
            if (mod === '')
              return '..';
            var lastSlash = mod.lastIndexOf('/');
            return lastSlash === -1 ? '' : mod.substr(0, lastSlash);
          }, resolveModule = function (mod) {
            var ret = baseModule(currentModule);
            mod.split('/').forEach(function (component) {
              if (component == '..') {
                ret = baseModule(ret);
              } else if (component !== '.') {
                if (ret.length)
                  ret += '/';
                ret += component;
              }
            });
            return ret;
          };
      }
      return define;
    }();
}
define('dep4', function (require, exports) {
  var fourth = exports.fourth = function () {
      return 4;
    };
});
define('lib/dep3', function (require, exports) {
  var dep4 = require('../dep4');
  var third = exports.third = function () {
      return 3 + dep4.fourth();
    };
});
define('lib/dep2', function (require, exports) {
  var dep3 = require('./dep3');
  var second = exports.second = function () {
      return 2 + dep3.third();
    };
});
define('dep', function (require, exports) {
  var dep2 = require('./lib/dep2');
  var first = exports.first = function () {
      return 1 + dep2.second();
    };
});
define('main', function (require, exports) {
  var dep = require('./dep');
  GLOBAL.main = function () {
    return dep.first();
  };
});