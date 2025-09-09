# Overview: Browser Import/Export Module System

## Purpose

The `browser-import-export` package provides a lightweight, ES modules-inspired module system specifically designed for rapid prototyping in the browser. It enables developers to write modular JavaScript within HTML files without requiring a build step or complex tooling.

## Core Problem

When prototyping in the browser, developers face several challenges:

1. **Dependency ordering**: Scripts must be loaded in the correct dependency order
2. **No native module system**: Browser environments lack a simple module system for inline scripts
3. **Build complexity**: Setting up bundlers and build tools adds friction to rapid prototyping
4. **Async coordination**: Managing asynchronous dependencies between script tags is complex

## Solution Approach

This module system provides:

- **Promise-based module resolution**: Modules can import dependencies that haven't been defined yet
- **Flexible import/export API**: Simple `module.import()` and `module.export()` functions
- **Multiple import patterns**: Support for both array and object destructuring
- **Name transformation**: Automatic conversion of kebab-case module names to camelCase properties
- **Zero dependencies**: Pure JavaScript implementation with no external dependencies

## Key Benefits

1. **Write code in logical order**: Define modules in the order that makes sense, not dependency order
2. **Rapid prototyping**: No build step or compilation required
3. **Familiar patterns**: ES modules-inspired API that's easy to learn
4. **Flexible destructuring**: Support for both array and object destructuring of imports
5. **Smart name transformation**: Automatic camelCase conversion for property access
6. **Flexible usage**: Works with inline scripts, external files, or CDN distribution
7. **Debugging support**: Built-in debug utilities for troubleshooting module resolution

## Target Use Cases

- **Interactive tutorials**: Teaching JavaScript concepts without build complexity
- **Quick prototypes**: Testing ideas and concepts rapidly
- **Educational content**: Demonstrating modular programming concepts
- **Code experiments**: Trying out APIs or libraries in isolation
- **Browser environments**: Module-like patterns in environments without native ES modules

## Design Philosophy

- **Simplicity over features**: Prioritize ease of use over comprehensive functionality
- **Minimal API surface**: Keep the learning curve as shallow as possible
- **Browser-first**: Designed specifically for browser environments, not Node.js
- **No magic**: Behavior should be predictable and easy to understand
- **Graceful debugging**: Provide clear feedback when things go wrong

## Architecture Overview

The system consists of three main components:

1. **Module Registry**: Central store for all defined and requested modules
2. **Promise-based Resolution**: Async coordination of dependencies using native Promises
3. **Import/Export API**: Simple functions for module definition and consumption

The implementation uses a Map-based registry where each module entry contains:
- Resolution state (resolved/pending)
- Module value (once resolved)  
- Promise for async resolution
- Resolve function to complete the promise

This creates a coordination layer that allows modules to import dependencies before they're defined, with automatic resolution when dependencies become available.