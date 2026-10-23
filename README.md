# async-traverse-tree

[![npm version](https://img.shields.io/npm/v/async-traverse-tree.svg)](https://www.npmjs.com/package/async-traverse-tree)
[![Build Status](https://github.com/bezoerb/async-traverse-tree/workflows/CI/badge.svg)](https://github.com/bezoerb/async-traverse-tree/actions?workflow=CI)
[![Coverage Status](https://coveralls.io/repos/github/bezoerb/async-traverse-tree/badge.svg?branch=main)](https://coveralls.io/github/bezoerb/async-traverse-tree?branch=main)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bezoerb/async-traverse-tree/blob/main/LICENSE)

`async-traverse-tree` is a lightweight, asynchronous library for traversing and mapping tree-like data structures.

## Features

- Asynchronously traverses and modifies objects and arrays.
- Easy-to-use API for applying custom functions to each value in the tree.
- Prevents circular references to maintain data integrity.

## Installation

You can install `async-traverse-tree` using npm or yarn:

```shell
npm install async-traverse-tree
```

or

```shell
yarn add async-traverse-tree
```

## Usage

Here's a simple example of how to use `async-traverse-tree` with the updated implementation:

```javascript
// Import the 'traverse' function from 'async-traverse-tree'
import { traverse } from 'async-traverse-tree';

// Define a custom mapper function
const mapper = async (key, value) => {
  // Apply your custom logic here asynchronously
  return value;
};

// Your data structure
const data = /* Your data structure here */;

// Asynchronously traverse and map the data
traverse(data, mapper)
  .then(result => {
    // Process the result
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

### Controlling Tree Traversal

The async-traverse-tree module exports two symbols that can be used to control the traversal process:

* **STOP**: Returning STOP from your mapper function will halt traversal of the current branch. No child nodes will be processed.
* **REMOVE**: Returning REMOVE from your mapper function will remove the current key/value pair from the tree.


```javascript
import { traverse, STOP, REMOVE } from 'async-traverse-tree';

const mapper = async (key, value) => {

  // stop traversing deeper into this branch
  if (skipCondition) {
    return STOP
  }

  // remove this key/value completely
    if (removeCondition) {
    return REMOVE
  }

  // Apply your custom logic here asynchronously
  return value;
};
```

## Development

Use Node.js 22.20+, 24.12+, or 26+ with npm 11.19.1 for the development tools. CI tests Node.js 22, 24, and 26.
The library's declared runtime requirement remains Node.js 16+, but CI does not test older releases.

```shell
npm ci --ignore-scripts
npm run test:ci
npm run benchmark
npm run audit
```

Dependency install scripts are disabled in `.npmrc`. See the [security assessment](https://github.com/bezoerb/async-traverse-tree/blob/main/SECURITY-AUDIT.md) for known development dependency advisories.

The benchmark retains the comparison with native JSON and runs without coverage instrumentation. Its speed assertion can fail on different runtimes or runners.
CI reports benchmark failures separately from the required correctness tests.

## Security considerations

Validate untrusted input before traversal and limit its depth and size. Deep trees can exhaust the JavaScript call stack.
Traversal has no node budget or timeout. Use a worker with a termination deadline when you need a hard resource limit.

Getters, proxies, and mapper functions can execute application code. Only traverse trusted JavaScript objects or validated JSON data.
If a mapper fetches URLs, the caller must enforce URL restrictions and request timeouts.

## Motivation

An easy way to iterate over an object-like structure is to use `JSON.parse(JSON.stringify(obj), (key, value) => ... )`.\
The problem with this approach is that it can't handle circular references and is synchronous. `async-traverse-tree` can act like an async drop-in replacement for that which can also handle circular references.
