# Design: Browser Import/Export Module System

*This document provides the technical design and implementation specification for the browser module system described in [01-overview.md](./01-overview.md) and [02-requirements.md](./02-requirements.md).*

## Implementation Principles

### 1. Simplicity and Clarity
Implementation strengths:
- **Straightforward promise-based architecture** without over-engineering
- **Clear error messages** that are easy to understand
- **Minimal API surface** that's easy to learn
- **Readable code structure** that's easy to maintain

### 2. Proven Debugging Experience
The `module.debug()` implementation should call `console.log()` directly:
- **Direct console.log() approach** works well for troubleshooting
- **Direct registry inspection** shows module resolution state clearly
- **No complex debugging infrastructure** needed

### 3. Robust Argument Validation
Error handling provides good examples:
```javascript
// Clear, specific error messages
throw new Error(`[module] "${name}" already exported`);
```

These patterns should be maintained or enhanced in the implementation.

## Architecture Overview

The module system uses a centralized registry pattern with Promise-based dependency resolution. The core architecture consists of:

1. **Module Registry**: A Map storing module metadata and resolution state
2. **Promise Coordination**: Using native Promises to handle async dependencies  
3. **Name Transformation**: Converting module names to valid JavaScript identifiers
4. **Hybrid Return Types**: Arrays that also support named access patterns

## Core Components

### Module Registry Structure

Each module entry in the registry contains:

```javascript
{
  resolved: boolean,     // Whether module has been exported
  value: any,           // The exported value (undefined until resolved)  
  promise: Promise,     // Promise that resolves to the value
  resolve: Function,     // Function to resolve the promise
}
```

Using `Map` instead of plain objects provides:
- Better performance for dynamic keys
- Cleaner iteration and debugging
- Avoids prototype pollution issues

### Global API Surface

```javascript
globalThis.module = {
  import: importModules,  // Import one or more modules
  export: exportModule,   // Export a module  
  debug,                  // Debug utility
};
```

## Key Design Decisions

### Decision 1: Hybrid Array/Object Returns

**Rationale**: Supporting both array and object destructuring patterns increases developer flexibility:
```javascript
// Array destructuring - positional
const [utils, dom] = await module.import("utils", "dom");

// Object destructuring - named
const { utils, dom } = await module.import("utils", "dom");  
```

**Implementation**: Return arrays that also have named properties for each module.

### Decision 2: Name Transformation Strategy

**Approach**: Transform module names to valid JavaScript identifiers:

```javascript
function toCamelCase(name) {
  const leadingSpecialCharacters = /^[@_]/g;
  const specialCharacters = /[@\/\.]/g;
  const hyphenFollowedByLetter = /-([a-z])/g;
  
  return name
    .replace(leadingSpecialCharacters, '')           // Remove leading @, _
    .replace(specialCharacters, '-')        // Replace @, /, . with -  
    .replace(hyphenFollowedByLetter, function(_, letter) { return letter.toUpperCase(); });
}
```

Examples:
- `"dom-helpers"` → `"domHelpers"`
- `"@utils/string"` → `"utilsString"`
- `"lodash.debounce"` → `"lodashDebounce"`

### Decision 3: Promise.withResolvers() Usage

**Rationale**: Modern Promise constructor pattern is cleaner than creating promises with external resolve/reject functions.

**Note**: Target modern browsers only, so compatibility fallbacks may not be needed.

### Decision 4: Error Handling Strategy  

**Enhanced approach**: Descriptive errors that are easy to understand:

```javascript
// Enhanced: Contextual error  
throw new Error(`[module.export] Module "${name}" already exported`);
```

## API Specification

### module.import(...names)

**Signature**: `importModules(...args: string[]) => Promise<ModuleArray>`

**Behavior**:
1. Flatten all arguments into array of module names
2. Create promises for each module (using `get()`)  
3. Wait for all promises to resolve using `Promise.all()`
4. Create result array with imported modules
5. Add camelCase property names for named destructuring
6. Add original names as properties (for fallback access)

**Return Type**: `ModuleArray` - Array that supports both indexed and named destructuring

**Example**:
```javascript
const result = await module.import("utils", "dom-helpers");
// Array access: result[0] === utils, result[1] === dom-helpers
// Named access: result.utils === utils module
// Named access: result.domHelpers === dom-helpers module  
// Named access: result["dom-helpers"] === dom-helpers module
```

### module.export(name, value)

**Signature**: `exportModule(name: string, value: any) => void`

**Behavior**:
1. Get or create module entry for name
2. Check if already resolved (throw if yes)
3. Set value and resolved flag
4. Resolve the promise
5. Log debug message

**Error Cases**:
- Module already exported: `Error: [module] "${name}" already exported`

### module.debug()

**Signature**: `debug() => void`

**Behavior**: Calls `console.log()` directly to log registry state for debugging.

**Implementation approach**: Direct `console.log(modules)` call is effective and lightweight.

## Implementation Architecture

### Core Functions

```javascript
// Module registry - using Map for better performance
const modules = new Map();

// Get or create module entry
function get(name) {
  if (!modules.has(name)) {
    const { promise, resolve } = Promise.withResolvers();
    modules.set(name, { resolved: false, value: undefined, promise, resolve });
  }
  return modules.get(name);
}

// Main import function  
async function importModules(...args) {
  const names = args.flat();
  const results = await resolveAll(names);
  const importedModules = results.map(result => result.module);
  
  // Add camelCase names for named destructuring
  for (const { name, module } of results) {
    const key = toCamelCase(name);
    importedModules[key] = module;
  }
  
  // Add original module names as fallback
  for (const { name, module } of results) {
    const key = name;
    importedModules[key] = module;
  }
  
  return importedModules;
}

// Helper function to resolve all module promises
async function resolveAll(names) {
  const promises = names.map(async (name, index) => {
    const module = await get(name).promise;
    return { index, name, module };
  });
  return await Promise.all(promises);
}

// Main export function
function exportModule(name, value) {
  const module = get(name);
  if (module.resolved) throw new Error(`[module] "${name}" already exported`);
  
  module.value = value;
  module.resolved = true; 
  module.resolve(value);
  console.debug(`[module] Exported: ${name}`);
}

// Debug utility
function debug() {
  console.log(modules);
}
```

### Performance Considerations

1. **Module Registry**: Map-based storage for O(1) lookups
2. **Memory Usage**: Only store necessary metadata per module
3. **Promise Overhead**: Minimal - one promise per module regardless of import count
4. **Name Transformation**: Computed once per module name, cached implicitly

## Testing Strategy

### Unit Tests Needed

1. **Basic Import/Export**:
   - Export then import
   - Import then export (async resolution)
   - Multiple imports of same module

2. **Destructuring Patterns**:
   - Object destructuring
   - Named access patterns

3. **Name Transformation**:
   - Simple names: `"utils"` → `"utils"`
   - Kebab case: `"dom-helpers"` → `"domHelpers"`  
   - Special chars: `"@utils/string"` → `"utilsString"`

4. **Error Handling**:
   - Duplicate exports
   - Invalid arguments
   - Missing dependencies

### Browser Testing

Test in Chrome to ensure compatibility:
- Chrome (Chromium)

## Future Considerations

### Potential Enhancements

1. **Module Loading**: Dynamic loading of external modules via URLs
2. **Circular Dependencies**: Detection and handling of circular imports
3. **Module Unloading**: Ability to remove/replace modules

### Constraints

- Maintain zero-dependency policy
- Keep implementation under 150 lines  
- Preserve simplicity over feature richness

## Implementation Summary

The finalized design focuses on the core module system with sophisticated features:

**Design principles**:
- Simple promise-based architecture without over-engineering
- Clear error messages and debugging utilities
- Zero dependencies and minimal footprint

**Core features**:
- Object destructuring support with name transformation
- Map-based module registry for better performance  
- Modern Promise patterns (`Promise.withResolvers()`)
- Enhanced documentation and typing

This creates a focused module system that serves both simple prototyping needs and more advanced modular development patterns.
