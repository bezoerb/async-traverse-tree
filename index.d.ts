/**
 * Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
 */
type Primitive =
  | null // eslint-disable-line @typescript-eslint/ban-types
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

type Callback = (key: string, value: unknown) => unknown | Promise<unknown>;

function isObject<T = Record<PropertyKey, unknown>>(input: any): input is T {
  return input && typeof input === "object";
}

function isPrimitive(x: any): x is Primitive {
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
  input: unknown,
  reviver?: Callback,
  key: string = "",
  seen: unknown[] = []
) => {
  if (seen.includes(input)) {
    return input;
  }
  const data = reviver ? await reviver(key, input) : input;

  if (!data || isPrimitive(data)) {
    return data;
  }

  if (Array.isArray(data)) {
    const result: unknown[] = Array(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = traverse(data[i], reviver, `${i}`, seen);
    }
    return Promise.all(result);
  }

  if (isObject(data)) {
    seen.push(data);
    const result: Record<PropertyKey, unknown> = {};
    for (const key in data) {
      result[key] = await traverse(data[key], reviver, `${key}`, seen);
    }

    return result;
  }

  return data;
};
