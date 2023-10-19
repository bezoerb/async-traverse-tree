import test from "ava";
import { traverse } from "./index.js";

test("should return the input if it is a primitive", async (t) => {
  const input = "hello world";
  const result = await traverse(input);
  t.is(result, input);
});

test("should return a new object with the same keys and traversed values", async (t) => {
  const input = {
    foo: {
      bar: {
        baz: "hello world",
      },
    },
  };
  const expected = {
    foo: {
      bar: {
        baz: "HELLO WORLD",
      },
    },
  };
  const mapper = (key, value) => {
    return typeof value === "string" ? value.toUpperCase() : value;
  };

  const result = await traverse(input, mapper);
  t.like(result, expected);
});

test("should return a new array with the same elements and traversed values", async (t) => {
  const input = [
    {
      foo: "hello",
    },
    {
      bar: "world",
    },
  ];
  const expected = [
    {
      foo: "HELLO",
    },
    {
      bar: "WORLD",
    },
  ];
  const mapper = (key, value) =>
    typeof value === "string" ? value.toUpperCase() : value;
  const result = await traverse(input, mapper);
  t.like(result, expected);
});

test("should handle null and undefined values", async (t) => {
  const input = {
    foo: null,
    bar: undefined,
  };
  const expected = {
    foo: null,
    bar: undefined,
  };
  const result = await traverse(input);

  t.like(result, expected);
});

test("should handle Promises returned by the mapper function", async (t) => {
  const input = {
    foo: "hello",
    bar: "world",
  };
  const expected = {
    foo: "HELLO",
    bar: "WORLD",
  };
  const mapper = async (key, value) =>
    typeof value === "string"
      ? await Promise.resolve(value.toUpperCase())
      : value;
  const result = await traverse(input, mapper);
  t.like(result, expected);
});

test("should act as a drop-in replacement for JSON.parse(JSON.stringify(obj),mapper)", async (t) => {
  const data = [
    { a: 1, b: true, c: { x: 1 }, d: [1, { y: 2 }] },
    "abc",
    { empty: [{ remove: "me" }] },
  ];
  const mapper = (key, value) => {
    if (key === "a") {
      return 10;
    }
    if (key === "empty") {
      return null;
    }
    if (typeof value === "number") {
      return value * 2;
    }
    if (typeof value === "string") {
      return value.toUpperCase();
    }
    if (typeof value === "boolean") {
      return !value;
    }
  };

  const expected = JSON.parse(JSON.stringify(data), mapper);
  const result = await traverse(data, mapper);
  t.is(result, expected);
});

test("should be faster than JSON.parse", async (t) => {
  const input = {
    foo: "hello",
    bar: "world",
    arr: ["a", "b", "c"],
  };
  const mapper = (key, value) =>
    typeof value === "string" ? value.toUpperCase() : value;

  const iterations = Array(1000000).fill(0);

  const startTraverse = Date.now();
  for (const _ of iterations) {
    await traverse(input, mapper);
  }
  const timeTraverse = Date.now() - startTraverse;

  const startNative = Date.now();
  for (const _ of iterations) {
    JSON.parse(JSON.stringify(input), mapper);
  }
  const timeNative = Date.now() - startNative;

  t.true(timeTraverse < timeNative);
});

test("should handle circular references", async (t) => {
  const object = {
    one: "one",
    array: ["two"],
  };
  object.circular = object;
  object.array2 = object.array;
  object.array.push(object);

  const result = await traverse(object, (_, val) =>
    typeof val === "string" ? val.toUpperCase() : val
  );

  const expected = {
    one: "ONE",
    array: ["TWO"],
  };
  expected.circular = expected;
  expected.array2 = expected.array;
  expected.array.push(expected);

  t.deepEqual(result, expected);
});
