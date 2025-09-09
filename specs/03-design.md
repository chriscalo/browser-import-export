# Design: Browser Import/Export Module System

*This document provides the technical design and implementation specification for the browser module system described in [01-overview.md](./01-overview.md) and [02-requirements.md](./02-requirements.md).*

## Superior Aspects of Current Implementation

After analyzing the current implementation against the specifications, several aspects of the current code should be preserved or serve as inspiration:

### 1. Simplicity and Clarity
Current implementation strengths:
- **Straightforward promise-based architecture** without over-engineering
- **Clear error messages** that are easy to understand
- **Minimal API surface** that's easy to learn
- **Readable code structure** that's easy to maintain

### 2. Proven Debugging Experience
The current `module.debug()` implementation is effective:
- **Simple console.log approach** works well for troubleshooting
- **Direct registry inspection** shows module resolution state clearly
- **No complex debugging infrastructure** needed

### 3. Robust Argument Validation
Current error handling provides good examples:
```javascript
// Clear, specific error messages
throw `define() called with ${argsCount}. 2 or 3 arguments expected.`;
throw `callback is not a function`;
throw `deps must be an Array of strings. Got instead: ${deps}`;
```

These should be maintained or enhanced in the new implementation.

## Architecture Overview

The module system uses a centralized registry pattern with Promise-based dependency resolution. The core architecture consists of:

1. **Module Registry**: A Map storing module metadata and resolution state
2. **Promise Coordination**: Using native Promises to handle async dependencies  
3. **Name Transformation**: Converting module names to valid JavaScript identifiers
4. **Hybrid Return Types**: Array-like objects supporting both indexed and named access

## Core Components

### Module Registry Structure

Each module entry in the registry contains:

```javascript
{
  resolved: boolean,     // Whether module has been exported
  value: any,           // The exported value (undefined until resolved)  
  promise: Promise,     // Promise that resolves to the value
  resolve: Function     // Function to resolve the promise
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
  debug                   // Debug utility
};
```

## Key Design Decisions

### Decision 1: Hybrid Array/Object Returns

**Rationale**: Supporting both destructuring patterns increases developer flexibility:
```javascript
// Array destructuring - positional  
const [utils, dom] = await module.import("utils", "dom");

// Object destructuring - named
const { utils, dom } = await module.import("utils", "dom");  
```

**Implementation**: Return objects that extend Array prototype and add named properties.

### Decision 2: Name Transformation Strategy

**Current approach weakness**: The current implementation doesn't transform names, limiting object destructuring.

**New approach**: Transform module names to valid JavaScript identifiers:

```javascript
function toCamelCase(name) {
  return name
    .replace(/^[@_]/g, '')           // Remove leading @, _
    .replace(/[@\/\.]/g, '-')        // Replace @, /, . with -  
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
```

Examples:
- `"dom-helpers"` → `"domHelpers"`
- `"@utils/string"` → `"utilsString"`
- `"lodash.debounce"` → `"lodashDebounce"`

### Decision 3: Promise.withResolvers() Usage

**Rationale**: Modern Promise constructor pattern is cleaner than creating promises with external resolve/reject functions.

**Fallback**: Include polyfill for browsers that don't support `Promise.withResolvers()`:

```javascript
if (!Promise.withResolvers) {
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
```

### Decision 4: Error Handling Strategy  

**Current implementation strength**: Simple error handling that's easy to understand.

**Enhanced approach**: More descriptive errors while maintaining simplicity:

```javascript
// Enhanced: Contextual error  
throw new Error(`[module.export] Module "${name}" already exported`);
throw new Error(`[module.import] Invalid module name: ${name}`);
```

## API Specification

### module.import(...names)

**Signature**: `importModules(...args: (string | string[])[]) => Promise<ModuleArray>`

**Behavior**:
1. Flatten all arguments into array of module names
2. Create promises for each module (using `get()`)  
3. Wait for all promises to resolve
4. Create array-like result object
5. Add camelCase property names for object destructuring
6. Add original names as properties (in case of conflicts)

**Example**:
```javascript
const result = await module.import("utils", "dom-helpers");
// result[0] === utils module  
// result[1] === dom-helpers module
// result.utils === utils module
// result.domHelpers === dom-helpers module  
// result["dom-helpers"] === dom-helpers module
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

**Behavior**: Log current module registry state to console for debugging.

**Current implementation strength**: Simple `console.log(modules)` is effective and lightweight.

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
  return createHybridArray(results);
}

// Main export function
function exportModule(name, value) {
  const module = get(name);
  if (module.resolved) throw new Error(`[module] "${name}" already exported`);
  
  module.value = value;
  module.resolved = true; 
  module.resolve(value);
}
```

## Migration Strategy

### Backward Compatibility

All existing core APIs remain unchanged:
- `module.import()` - enhanced with object destructuring support
- `module.export()` - same API, better error messages  
- `module.debug()` - same functionality

### New Features

- Object destructuring support for imports
- Name transformation for property access  
- Better error messages with context
- Modern Promise patterns internally

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
   - Array destructuring 
   - Object destructuring
   - Mixed access patterns

3. **Name Transformation**:
   - Simple names: `"utils"` → `"utils"`
   - Kebab case: `"dom-helpers"` → `"domHelpers"`  
   - Special chars: `"@utils/string"` → `"utilsString"`

4. **Error Handling**:
   - Duplicate exports
   - Invalid arguments
   - Missing dependencies

### Browser Testing

Test in multiple browsers to ensure compatibility:
- Chrome/Edge (Chromium)
- Firefox  
- Safari
- Fallback behavior for missing `Promise.withResolvers()`

## Future Considerations

### Potential Enhancements

1. **Module Loading**: Dynamic loading of external modules via URLs
2. **Circular Dependencies**: Detection and handling of circular imports
3. **Module Unloading**: Ability to remove/replace modules
4. **TypeScript Support**: Type definitions for better IDE experience

### Constraints

- Maintain zero-dependency policy
- Keep implementation under 200 lines  
- Preserve simplicity over feature richness
- Avoid breaking changes to existing API

## Implementation Summary

The finalized design focuses on the core module system while adding sophisticated features from the specification:

**Preserved from current**:
- Simple promise-based architecture without over-engineering
- Clear error messages and debugging utilities
- Zero dependencies and minimal footprint

**Added from specification**:
- Object destructuring support with name transformation
- Map-based module registry for better performance  
- Modern Promise patterns (`Promise.withResolvers()`)
- Enhanced documentation and typing

This creates a focused, backward-compatible module system that serves both simple prototyping needs and more advanced modular development patterns.