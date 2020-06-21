(function (global) {
  const modules = {};
  
  function get(name) {
    if (name in modules === false) {
      const module = modules[name] = {};
      module.data = new Promise(resolve => {
        module.isResolved = false;
        module.resolve = function(data) {
          resolve(data);
          module.isResolved = true;
        };
      });
    }
    return modules[name];
  }
  
  global.module = {
    import: name => get(name).data,
    export: (name, data) => get(name).resolve(data),
    debug: () => modules,
  };
})(this || globalThis || window);
