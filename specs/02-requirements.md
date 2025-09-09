# Requirements: Browser Import/Export Module System

*This document details the functional and non-functional requirements for the browser module system described in [01-overview.md](./01-overview.md). The technical implementation is specified in [03-design.md](./03-design.md).*

## Functional Requirements

### Core Module System

#### FR-1: Module Export
- **Description**: Allow scripts to export modules with unique names and values
- **API**: `module.export(name, value)`
- **Behavior**:
  - Must accept a string name and any value
  - Must resolve any pending imports for that module name
  - Must throw error if module name already exported
  - Must support exporting objects, functions, primitives, and classes

#### FR-2: Module Import
- **Description**: Allow scripts to import one or more modules by name
- **API**: `module.import(...names)`
- **Behavior**:
  - Must accept variable arguments of module names
  - Must return Promise that resolves to imported modules
  - Must support importing modules that haven't been exported yet
  - Must resolve Promise when all requested modules become available

#### FR-3: Multiple Import Patterns
- **Description**: Must support both indexed AND named destructuring of imports
- **Examples**:
  ```javascript
  // Array destructuring (positional access)
  const [utils, domHelpers] = await module.import("utils", "dom-helpers");
  
  // Object destructuring with automatic camelCase conversion
  const { utils, domHelpers } = await module.import("utils", "dom-helpers");
  ```
- **Behavior**:
  - Import results must support both indexed AND named destructuring
  - Must support named properties for destructuring
  - Module names must be converted to camelCase property names as additional property names
  - Original kebab-case names must also be available as additional property names

#### FR-4: Name Transformation
- **Description**: Convert module names to valid JavaScript identifiers
- **Rules**:
  - Remove leading special characters (@, _)
  - Replace @, /, . with hyphens
  - Convert kebab-case to camelCase
  - Examples: "dom-helpers" → "domHelpers", "@utils/string" → "utilsString"

### Debugging and Utilities

#### FR-5: Debug Utilities
- **Description**: Provide debugging information about module system state
- **API**: `module.debug()`
- **Behavior**:
  - Must return or log current module registry state
  - Must show which modules are resolved vs pending
  - Must be useful for troubleshooting import/export issues

## Non-Functional Requirements

### NFR-1: Performance
- Module resolution must be fast enough for development use
- Registry operations should be O(1) or O(log n) where possible
- Memory usage should be proportional to number of modules

### NFR-2: Browser Compatibility
- Must work in modern browsers (ES2017+)
- Should gracefully handle missing APIs (with appropriate polyfills if needed)
- Must not require transpilation or build tools

### NFR-3: Size Constraints
- Total implementation should be under 150 lines of code (simplified without AMD compatibility)
- Minified size should be under 4KB
- No external dependencies should be bundled into the distribution that end users consume from this package (dev dependencies okay)

### NFR-4: Error Handling
- Must provide clear error messages for users
- Must handle edge cases gracefully (duplicate exports, missing modules, etc.)
- Errors should include context (module names, operation types)
- Must detect once the page has loaded but there are unresolved imports and provide helpful warnings

### NFR-5: API Consistency
- API should feel familiar to developers who know ES modules
- Method names and behaviors should be predictable
- Return types should be consistent

### NFR-6: Publishing and Distribution
- Must auto-publish to GitHub Packages on release
- Package must be available for installation via npm from GitHub registry
- Must use GitHub Actions workflow triggered by version tags (v*.*.*) or manual dispatch
- Example workflow implementation:
  ```yaml
  name: Publish Package
  
  on:
    push:
      tags:
        - 'v*.*.*'
    workflow_dispatch:
  
  jobs:
    publish:
      runs-on: ubuntu-latest
      permissions:
        contents: read
        packages: write
      steps:
        - uses: actions/checkout@v4
        
        - uses: actions/setup-node@v4
          with:
            node-version: '24'
            registry-url: 'https://npm.pkg.github.com'
            scope: '@chriscalo'
        
        - run: npm ci
        
        - name: Install Playwright Browsers
          run: npx playwright install chromium
        
        - run: npm test
        
        - run: npm publish
          env:
            NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```

### NFR-7: Testing Requirements
- Must include `index.test.html` file that runs tests in a browser and logs results
- Must include `index.test.js` that uses `node:test` and `node:assert` modules
- `index.test.js` must use Puppeteer to run headless Chrome to load `index.test.html`, grab console output, and report test results
- Browser testing framework: we'll install `chriscalo/browser-test-framework`
- `index.test.html` will likely use `test` and `assert` from `chriscalo/browser-test-framework`

## Use Case Scenarios

### UC-1: Basic Module Definition and Import
```javascript
// Script 1: Export a utility module
module.export("utils", {
  formatDate(date) { return date.toISOString(); },
  parseJSON(str) { return JSON.parse(str); }
});

// Script 2: Import and use the module
const { utils } = await module.import("utils");
console.log(utils.formatDate(new Date()));
```

### UC-2: Cross-Module Dependencies
```javascript
// Script 1: Module that depends on others
const { http, dom } = await module.import("http", "dom");
module.export("app", {
  init() {
    const data = await http.get("/api/data");
    dom.render(data);
  }
});

// Script 2: Define dependencies later
module.export("http", { get: fetch });
module.export("dom", { render(data) { document.body.innerHTML = data; } });
```

### UC-3: Debug and Troubleshooting
```javascript
// Check what modules are available
module.debug();

// Import module that might not exist
try {
  const { missing } = await module.import("missing-module");
} catch (error) {
  console.error("Module import failed:", error);
  module.debug(); // See current state
}
```

## Constraints

### Technical Constraints
- Must work without build tools or bundlers
- Must not modify global prototypes or built-ins
- Must be compatible with strict mode
- Implementation must be self-contained in a single file

### Business Constraints  
- Implementation must be self-contained in a single file

### Security Constraints
- Must not eval() arbitrary code
- Must not expose internal implementation details globally