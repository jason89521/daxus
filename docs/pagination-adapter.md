# Pagination Adapter

In my daily work, most of the data I deal with is in the form of pagination, such as posts and comments. The pagination adapter is a tool used to handle this pagination data.

Let's take posts as an example to illustrate how the pagination adapter stores data:

```javascript
const shape = {
  entityRecord: {
    1: {
      id: 1,
      title: 'post1',
      // ...
    },
    // ...
  },
  paginationMetaRecord: {
    'popular=true': {
      ids: [1, 2 /* ... */],
      noMore: false,
    },
  },
};
```

The `entityRecord` stores the data of each post, with the post's ID as the key. The `paginationMetaRecord` is stored using a user-defined string, usually query parameters. In this example, it is `'popular=true'`. The `ids` field records which data is included in the pagination, and the `noMore` field indicates whether the pagination has reached the end.

## API

```typescript
const {
  initialModel,
  createOne,
  readOne,
  updateOne,
  deleteOne,
  upsertOne,
  readPagination,
  replacePagination,
  appendPagination,
} = createPaginationAdapter<Data>({ getId });
```

### `getId`

```typescript
getId: (data: Data) => Id;
```

Defines how to extract the ID from each data item. The default is `data => data.id`.

### `createOne`

```typescript
function createOne(model: Model, data: Data): void;
```

Adds a data item to the model.

### `readOne`

```typescript
function readOne(model: Model, id: Id): Data | undefined;
```

Reads the data item with the specified `id` from the model.

### `updateOne`

```typescript
function updateOne(model: Model, id: Id, data: Partial<Data>): void;
```

Updates the data item in the model that corresponds to the specified `id`.

### `deleteOne`

```typescript
function deleteOne(model: Model, id: Id): void;
```

Deletes the data item with the specified `id` from the model.

### `upsertOne`

```typescript
function upsertOne(model: Model, data: Data): void;
```

Updates the data item if it already exists in the model. Otherwise, adds it.

### `readPagination`

```typescript
interface Pagination<Data> {
  items: Data[];
  noMore: boolean;
}

function readPagination(model: Model, key: string): Pagination<Data> | undefined;
```

Reads the corresponding pagination with the specified `key` from the model.

### `replacePagination`

```typescript
function replacePagination(model: Model, key: string, data: Data[]): void;
```

Resets the corresponding pagination data with the specified `key` to the given `data`.

### `appendPagination`

```typescript
function appendPagination(model: Model, key: string, data: Data[]): void;
```

Appends the `data` to the corresponding pagination.
