import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { traverse } from './index.js';

const input = {
  foo: 'hello',
  bar: 'world',
  arr: ['a', 'b', 'c'],
};
const mapper = (_key, value) => (typeof value === 'string' ? value.toUpperCase() : value);
const iterations = 1_000_000;

assert.deepEqual(await traverse(input, mapper), JSON.parse(JSON.stringify(input), mapper));

const startTraverse = performance.now();
for (let i = 0; i < iterations; i++) {
  await traverse(input, mapper);
}
const timeTraverse = performance.now() - startTraverse;

const startNative = performance.now();
for (let i = 0; i < iterations; i++) {
  JSON.parse(JSON.stringify(input), mapper);
}
const timeNative = performance.now() - startNative;

console.log({ iterations, traverseMs: timeTraverse, nativeMs: timeNative });
assert.ok(timeTraverse < timeNative, `${timeTraverse} should be less than ${timeNative}`);
