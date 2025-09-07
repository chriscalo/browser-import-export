# Package: `browser-modules`

Note: `chriscalo/browser-import-export` already exists. Let's reuse that, bump
the major version number, and consider renaming the package.

**Alternative names:**

- `browser-import-export`
- `browser-module-loader`
- `browser-module-kit`
- `browser-module-coordinator`
- `browser-module-system`
- `html-module-loader`

## Contains

- Lightweight module registry with `import`/`export` API
- Promise-based dependency resolution
- Module name to property name mapping for destructuring

## Similar To

SystemJS, RequireJS — but designed for prototyping, not production. A
dead-simple module registry for coordinating script dependencies without any
build step.

## Why This Package

- Forms a complete module loading system with registry, resolution, and property
  access
- The name mapping utilities enable both array and object destructuring of
  imports
- All parts work together to provide the core functionality

## Technical Details

- **Estimated size:** ~170 lines
- **Dependencies:** None
- **Target:** Browser-based prototyping

## Usage Example

```javascript
// Export a module
module.export("utils", { formatDate, parseJSON });

// Import with array destructuring
const [utils, dom] = await module.import("utils", "dom");

// Import with object destructuring (using camelCase transformation)
const { utils, domHelpers } = await module.import("utils", "dom-helpers");
```

## Code References

### Core Implementation

- `index.html:842-1011` - Main module system implementation
  (`<script name="module">`)
  - `index.html:857-861` - Global module API definition
  - `index.html:863-864` - Module registry Map
  - `index.html:879-918` - Utility functions (pipe, toCamelCase)
  - `index.html:942-959` - importModules function
  - `index.html:979-988` - exportModule function
  - `index.html:998-1009` - Module entry creation

### Related Documentation

- `docs/projects/module/module.prd.md` - Product requirements document
- `docs/projects/module/module.design.md` - Architecture design
- `docs/projects/module/module.tasks.md` - Implementation tasks
- `docs/projects/module-loading/module-loading.design.md` - Loading strategy
- `docs/projects/module-loading/module-loading.tasks.md` - Loading tasks

### Test Files

- `index.html:1352-1350` - Module system tests (`<script name="module-test">`)

### Dependencies & Infrastructure

#### Used By (Critical Consumers)

- **All modules in index.html** - Every `<script type="module">` uses
  `module.import()` and `module.export()`
  - `index.html:18-24` - Vue reactivity module export
  - `index.html:34-44` - Icon sprite module
  - `index.html:1013-1031` - HTTP module
  - `index.html:1033-1054` - HTML utilities module
  - `index.html:1070-1350` - Test framework module
  - `index.html:1474-2291` - Template bindings module
  - 20+ other modules throughout index.html

#### Testing Infrastructure

- `npm run test:browser` - Browser test runner depends on module system
- `scripts/test:browser.js` - Test script that runs browser tests
- `test/browser.test.js` - Browser test harness
- `inspect/index.js` - Console capture tool loads index.html (uses module
  system)
- `npm run test` - Full test suite includes browser tests

#### Development Workflow

- `npm start` - Starts server that serves index.html with module system
- `inspect/` folder - Debugging tools that capture console output from modules
- Browser console - All module exports available for debugging

#### Key Integration Points

- Must load before all other modules (line 842 in index.html)
- Global `module` object exposed on `globalThis`
- No external dependencies - pure JavaScript
- Works with both inline and external scripts