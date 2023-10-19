/**
 * Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
 */
function isPrimitive(x) {
  return [
    "null",
    "undefined",
    "string",
    "number",
    "bigint",
    "boolean",
    "symbol",
  ].includes(typeof x);
}

const isObjectLike = (value) =>
  value !== null &&
  typeof value === "object" &&
  !(value instanceof RegExp) &&
  !(value instanceof Error) &&
  !(value instanceof Date) &&
  !(globalThis.Blob && value instanceof globalThis.Blob);

/**
 * Recursively traverses an object or array and applies a function to each value.
 * Mainly the same as JSON.parse(JSON.stringify(input, reviver)) but faster & async.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Using_the_reviver_parameter
 *
 * Used to modify the storyblok response.
 * @param input The object or array to traverse.
 * @param reviver An optional function to apply to each value during traversal.
 * @param key The current key being traversed (used for error messages).
 * @param seen An array of objects that have already been traversed (used to prevent circular references).
 * @returns A Promise that resolves to the traversed object or array.
 */
export const traverse = async (
  input,
  mapper,
  key = "",
  isSeen = new WeakMap()
) => {
  if (isSeen.has(input)) {
    return isSeen.get(input);
  }

  const data = mapper ? await mapper(key, input) : input;

  if (!data || isPrimitive(data)) {
    return data;
  }

  isSeen.set(input, data);

  if (Array.isArray(data)) {
    const resultPromises = Array(data.length);
    for (let i = 0; i < data.length; i++) {
      resultPromises[i] = traverse(data[i], mapper, `${i}`, isSeen);
    }
    const result = await Promise.all(resultPromises);
    isSeen.set(input, result);
    return result;
  }

  if (isObjectLike(data)) {
    const result = data;
    for (const key in data) {
      result[key] = await traverse(data[key], mapper, `${key}`, isSeen);
    }
    isSeen.set(input, result);
    return result;
  }

  return data;
};
