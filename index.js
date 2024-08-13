const isObjectLike = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !(value instanceof RegExp) &&
  !(value instanceof Error) &&
  !(value instanceof Date) &&
  !(globalThis.Blob && value instanceof globalThis.Blob);

/**
 * Recursively traverses an object or array and applies a function to each value.
 * Mainly the same as JSON.parse(JSON.stringify(input, reviver)) but faster & async.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Using_the_reviver_parameter
 *
 * @param input The object or array to traverse.
 * @param mapper An optional function to apply to each value during traversal.
 * @param key The current key being traversed (used for error messages).
 * @param isSeen WeakMap of objects that have already been traversed (used to prevent circular references).
 * @returns A Promise that resolves to the traversed object or array.
 */
const _traverse = async (source, mapper, key = '', isSeen = new WeakMap()) => {
  if (isSeen.has(source)) {
    return isSeen.get(source);
  }

  const data = mapper ? await mapper(key, source) : source;

  if (Array.isArray(data)) {
    const result = [...data];
    try {
      isSeen.set(source, result);
    } catch {}
    for (let i = 0; i < data.length; i++) {
      result[i] = await _traverse(result[i], mapper, `${i}`, isSeen);
    }
    return result;
  }

  if (isObjectLike(data)) {
    const result = { ...data };
    try {
      isSeen.set(source, result);
    } catch {}
    for (const [key, value] of Object.entries(result)) {
      result[key] = await _traverse(value, mapper, `${key}`, isSeen);
    }
    return result;
  }

  return data;
};

export const traverse = (source, mapper) => {
  return _traverse(source, mapper);
};
