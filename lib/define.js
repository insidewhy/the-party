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