# async-traverse-tree

[![npm version](https://img.shields.io/npm/v/async-traverse-tree.svg)](https://www.npmjs.com/package/async-traverse-tree)
[![Build Status](https://github.com/bezoerb/async-traverse-tree/workflows/CI/badge.svg)](https://github.com/bezoerb/async-traverse-tree/actions?workflow=CI)
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

## Additional Notes

The library now includes an updated implementation with an `isPrimitive` function for detecting primitive values, enhancing the overall functionality of `async-traverse-tree`.

## Contributing

We welcome contributions from the community. If you'd like to contribute to this project, please follow our [Contribution Guidelines](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
