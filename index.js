const isObjectLike = (value) =>
  value !== null &&
  typeof value === "object" &&
  !(value instanceof RegExp) &&
  !(value instanceof Error) &&
  !(value instanceof Date) &&
  !(globalThis.Blob && value instanceof globalThis.Blob);

const isTraversable = (value) => Array.isArray(value) || isObjectLike(value);

/**
 * Recursively traverses an object or array and applies a function to each value.
 * Mainly the same as JSON.parse(JSON.stringify(input, reviver)) but faster & async.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Using_the_reviver_parameter
 *
 * Used to modify the storyblok response.
 * @param input The object or array to traverse.
 * @param mapper An optional function to apply to each value during traversal.
 * @param key The current key being traversed (used for error messages).
 * @param isSeen WeakMap of objects that have already been traversed (used to prevent circular references).
 * @returns A Promise that resolves to the traversed object or array.
 */
const _traverse = async (
  source,
  mapper,
  key = "",
  isSeen = new WeakMap()
) => {
  if (isSeen.has(source)) {
    return isSeen.get(source);
  }

  const data = mapper ? await mapper(key, source) : source;

  if (isTraversable(data)) {
    isSeen.set(source, data);
  }

  if (Array.isArray(data)) {
    const resultPromises = Array(data.length);
    for (let i = 0; i < data.length; i++) {
      resultPromises[i] = _traverse(data[i], mapper, `${i}`, isSeen);
    }
    const result = await Promise.all(resultPromises);
    isSeen.set(source, result);
    return result;
  }

  if (isObjectLike(data)) {
    const result = data;
    for (const key in data) {
      result[key] = await _traverse(data[key], mapper, `${key}`, isSeen);
    }
    isSeen.set(source, result);
    return result;
  }

  return data;
};

export const traverse = (source, mapper) => _traverse(source, mapper);
