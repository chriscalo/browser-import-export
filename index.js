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
  
  const module = {
    import: name => get(name).data,
    export: (name, data) => get(name).resolve(data),
    debug: () => modules,
  };
  
  async function define() {
    let name, deps, callback;
    if (arguments.length < 2) {
      const argsCount = {
        "0": "0 arguments",
        "1": "1 argument",
      }[arguments.length];
      throw `define() called with ${argsCount}. 2 or 3 arguments expected.`;
    } else if (arguments.length === 2) {
      deps = [];
      [ name, callback ] = arguments;
    } else {
      [ name, deps, callback ] = arguments;
    }
    
    if (typeof callback !== "function") {
      throw `callback is not a function`;
    }
    
    const promises = deps.map(module.import);
    const resolvedDeps = await Promise.all(promises);
    const value = await callback(...resolvedDeps);
    module.export(name, value);
  };
  
  async function require() {
    let deps, callback;
    if (arguments.length < 1) {
      const { length } = arguments;
      throw `require() called with 0 args. 1 or 2 args expected.`;
    } else if (arguments.length === 1) {
      deps = [];
      [ callback ] = arguments;
    } else {
      [ deps, callback ] = arguments;
    }
    
    if (typeof callback !== "function") {
      throw `callback must be a function. Got instead: ${typeof callback} ${callback}`;
    }
    
    if (!Array.isArray(deps)) {
      throw `deps must be an Array. Got instead: ${typeof deps} ${deps}`;
    };
    
    if (!deps.every(isString)) {
      throw `deps must be an Array of strings. Got instead: ${deps}`;
    };
    
    const promises = deps.map(name => get(name).data);
    const resolvedDeps = await Promise.all(promises);
    callback(...resolvedDeps);
  };
  
  function isString(value) {
    return typeof value === "string";
  }
  
  global.module = module;
  global.define = define;
  global.require = require;
  
})(this || globalThis || window);
