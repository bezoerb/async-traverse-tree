/**
 * A custom function to map and modify values during traversal.
 */
export type Mapper = (
  key: PropertyKey,
  value: any
) => any | Promise<any>;

/**
 * Recursively traverses an object or array and applies a function to each value.
 * @param source The object or array to traverse.
 * @param mapper An optional function to apply to each value during traversal.
 * @returns A Promise that resolves to the traversed object or array.
 * 
 * @example
```
import traverse from 'async-traverse-tree';

const newObject = await traverse({foo: 'bar'}, (_key, value) => value.toUpperCase());
//=> {foo: 'BAR'}

const newObject = await traverse({test: 'fetch', resolve: 'https://my.api.endpoint'}, (key, value) => {
  if (key === 'resolve') {
    return fetch(value);
  }
  return value;
});
//=> {test: 'fetch', resolve: Response from fetch}

const newObject = await traverse([1,2,{url: 'https://my.api.endpoint'}], async (_key, value) => {
  if (value?.url) {
    return {
      url: 'https://my.api.endpoint',
      data: await fetch(value.url),
    }
  }
  return value;
});
//=> [1,2,{url: 'https://my.api.endpoint', data: Response from fetch}]
```
 */
export function traverse<
  SourceObjectType = any,
  TargetObjectType = SourceObjectType
>(
  source: SourceObjectType,
  mapper?: Mapper,
): Promise<TargetObjectType>;
