/**
 * Global module system for managing script dependencies.
 * 
 * @example
 * module.export("util", { formatDate, parseJSON });
 * 
 * @example
 * const { formatDate, parseJSON } = await module.import("util");
 * 
 * @example
 * const { util, dom } = await module.import("util", "dom");
 */

globalThis.module = {
  import: importModules,
  export: exportModule,
  debug,
};

/** @type {Map<string, {resolved: boolean, value: any, promise: Promise<any>, resolve: Function}>} */
const modules = new Map();

/**
 * Debug utility to log the current state of all modules.
 * Shows which modules are registered and their resolution status.
 */
function debug() {
  console.log(modules);
}

/**
 * Create a function that applies a sequence of transformations.
 * @param {Function[]} functions - Array of transformation functions
 * @returns {Function} Function that applies all transformations in sequence
 * @private
 */
function pipe(functions) {
  return function(value) {
    let result = value;
    for (const fn of functions) {
      result = fn(result);
    }
    return result;
  };
}

/**
 * Transform module name to camelCase identifier.
 * @param {string} name - Module name to transform
 * @returns {string} CamelCase identifier
 * @private
 */
function toCamelCase(name) {
  const transforms = [
    function removeLeadingSpecialCharacters(string) {
      // replaceAll() requires /g modifier on regular expressions
      const leadingSpecialCharacters = /^[@_]/g;
      const emptyString = "";
      return string.replaceAll(leadingSpecialCharacters, emptyString);
    },
    function replaceSpecialCharactersWithDash(string) {
      const specialCharacters = /[@\/\.]/g;
      const dash = "-";
      return string.replaceAll(specialCharacters, dash);
    },
    function dropHyphenAndCapitalizeNextLetter(string) {
      const hyphenFollowedByLetter = /-([a-z])/g;
      function capitalizeLetter(_, letter) {
        return letter.toUpperCase();
      }
      return string.replaceAll(hyphenFollowedByLetter, capitalizeLetter);
    }
  ];
  
  return pipe(transforms)(name);
}

/**
 * @typedef {Array & Record<string, *>} ModuleArray
 * Array of imported modules that also supports named property access
 * by original module name and camelCase variants.
 */

/**
 * Import one or more modules by name.
 * Supports both multi-arg and array input.
 * Returns hybrid object supporting both array and named destructuring.
 * 
 * @param {...(string|string[])} args - Module names (supports mixed args
 *   and arrays)
 * @returns {Promise<ModuleArray>} Array of modules with named property access
 * 
 * @example
 *   const [utils, stringUtils] = await module.import("utils", "string-utils");
 * 
 * @example  
 *   const { utils, stringUtils } = await module.import("utils", "string-utils");
 */
async function importModules(...args) {
  const names = args.flat();
  const results = await resolveAll(names);
  const importedModules = results.map(result => result.module);
  
  for (const { name, module } of results) {
    const key = toCamelCase(name);
    importedModules[key] = module;
  }
  
  // Add original module names after camelCase names in case of conflict
  for (const { name, module } of results) {
    const key = name;
    importedModules[key] = module;
  }
  
  return importedModules;
}

async function resolveAll(names) {
  const promises = names.map(async (name, index) => {
    const module = await get(name).promise;
    return { index, name, module };
  });
  return await Promise.all(promises);
}

/**
 * Export a module with the given name and value.
 * Can only be called once per module name.
 * 
 * @param {string} name - Unique name for the module
 * @param {*} value - The value to export (usually an object with multiple exports)
 * @throws {Error} If a module with this name has already been exported
 * @example
 * module.export("color-utils", { ColorScale, ColorPicker, hexToRGB });
 */
function exportModule(name, value) {
  const module = get(name);
  if (module.resolved) {
    throw new Error(`[module] "${name}" already exported`);
  }
  module.value = value;
  module.resolved = true;
  module.resolve(value);
  console.debug(`[module] Exported: ${name}`);
}

/**
 * Get or create a module entry.
 * Creates a promise that will resolve when the module is exported.
 * 
 * @param {string} name - Module name
 * @returns {{resolved: boolean, value: any, promise: Promise<any>, resolve: Function}}
 * @private
 */
function get(name) {
  if (!modules.has(name)) {
    const { promise, resolve } = Promise.withResolvers();
    modules.set(name, {
      resolved: false,
      value: undefined,
      promise,
      resolve,
    });
  }
  return modules.get(name);
}
