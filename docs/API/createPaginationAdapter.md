# `createPaginationAdapter`

A function return an object which provides the initial state and many operation functions.

```ts
const {
  initialState,
  createOne,
  tryReadOne,
  tryReadOneFactory,
  readOne,
  updateOne,
  deleteOne,
  upsertOne,
  tryReadPaginationMeta,
  tryReadPaginationMetaFactory,
  readPaginationMeta,
  tryReadPagination,
  tryReadPaginationFactory,
  readPagination,
  replacePagination,
  replacePagination,
  appendPagination,
  prependPagination,
  setMore,
} = createPaginationAdapter({ getId, transform });
```

## Argument

### `getId`

The function to get the id from your data. Default value is `data => data.id`.

```ts
type Id = string | number;
function getId<D>(data: D): Id;
```

### `transform`

Transform the data from the server to what you want. Default value is `rawData => rawData`.

```ts
function transform(rawData: R): D;
```

## Returns

### `initialState`

```typescript
interface PaginationMeta {
  ids: Id[];
  noMore: boolean;
}

interface PaginationState<Data> {
  entityRecord: Record<string, Data | undefined>;
  paginationMeta: Record<string, PaginationMeta | undefined>;
}
```

The initial state of the pagination. Although the `ids` is stored with `string`, the id of your data can be `number` or `string`.

### `createOne`

Add the data to the state.

```ts
function createOne(draft: Draft<State>, rawData: RawData): void;
```

### `tryReadOne`

Try to read the data with the specified id. If it is not existed, return `undefined`.

```ts
function tryReadOne(state: State, id: Id): Data | undefined;
```

### `tryReadOneFactory`

Returns a function that accept a `state` as a parameter. It is useful when you are using `useAccessor`.

```ts
function tryReadOneFactory(id: Id): (state: State) => Data | undefined;
```

### `readOne`

Read the data with the specify id. If the data is not existed , it will throw an error. This function is useful when you are sure that the data is existed.

```ts
function readOne(state: State, id: Id): Data;
```

### `updateOne`

Update the entity with the new data. If the entity is not existed, do nothing.

```ts
function updateOne(draft: Draft<State>, id: Id, data: Partial<Data>): void;
```

### `deleteOne`

Delete the entity with the specified id and remove the data from pagination (if existed).

```ts
function deleteOne(draft: Draft<State>, id: Id): void;
```

### `upsertOne`

Update the entity with the data. If the entity is not existed, insert it to the state.

```ts
function upsertOne(draft: Draft<State>, rawData: RawData): void;
```

### `tryReadPaginationMeta`

Try to read the pagination meta. If the meta is not existed, return `undefined`.

```ts
function tryReadPaginationMeta(state: State, key: string): PaginationMeta | undefined;
```

### `tryReadPaginationMetaFactory`

This function returns a function that accepts a state as the only one parameter. It is useful when using `useAccessor`

```ts
function tryReadPaginationMetaFactory(key: string): (state: State) => PaginationMeta | undefined;
```

### `readPaginationMeta`

Read the pagination meta with the specified key. If it is not existed, throw an error. It is useful when you are sure that the pagination is existed.

```ts
function readPaginationMeta(state: State, key: string): PaginationMeta;
```

### `tryReadPagination`

Try to read the pagination with the specified key. If it is not existed, return `undefined`.

```ts
interface Pagination<Data> {
  items: Data[];
  noMore: boolean;
}

function tryReadPagination(state: State, key: string): Pagination<Data> | undefined;
```

### `tryReadPaginationFactory`

Returns a function that accepts state as the only one parameter. If is useful when using `useAccessor`.

```ts
function tryReadPaginationFactory(key: string): (state: State) => Pagination<Data> | undefined;
```

### `readPagination`

Read the pagination with the specified key. If the pagination is not existed, throw an error. It is useful when you are sure that the pagination is existed.

```ts
function readPagination(state: State, key: string): Pagination<Data>;
```

### `replacePagination`

Replace the whole pagination with the given data array.

```ts
function replacePagination(draft: Draft<State>, paginationKey: string, rawData: RawData[]): void;
```

### `appendPagination`

Append the data to the pagination. If the pagination is not existed, create one.

```ts
function appendPagination(draft: Draft<State>, key: string, rawData: RawData[]): void;
```

### `prependPagination`

Prepend the data to the pagination. If the pagination is not existed, create one.

```ts
function prependPagination(draft: Draft<State>, key: string, rawData: RawData[]): void;
```

### `setNoMore`

Set the `noMore` property in the pagination meta.

```ts
function setNoMore(draft: Draft<State>, key: string, noMore: boolean): void;
```
