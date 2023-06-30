[react-server-model](../README.md) / PaginationAdapter

# Interface: PaginationAdapter<Data, RawData\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `RawData` | `Data` |

## Table of contents

### Properties

- [initialState](PaginationAdapter.md#initialstate)

### Methods

- [appendPagination](PaginationAdapter.md#appendpagination)
- [createOne](PaginationAdapter.md#createone)
- [deleteOne](PaginationAdapter.md#deleteone)
- [prependPagination](PaginationAdapter.md#prependpagination)
- [readOne](PaginationAdapter.md#readone)
- [readPagination](PaginationAdapter.md#readpagination)
- [readPaginationMeta](PaginationAdapter.md#readpaginationmeta)
- [replacePagination](PaginationAdapter.md#replacepagination)
- [setNoMore](PaginationAdapter.md#setnomore)
- [sortPagination](PaginationAdapter.md#sortpagination)
- [tryReadOne](PaginationAdapter.md#tryreadone)
- [tryReadOneFactory](PaginationAdapter.md#tryreadonefactory)
- [tryReadPagination](PaginationAdapter.md#tryreadpagination)
- [tryReadPaginationFactory](PaginationAdapter.md#tryreadpaginationfactory)
- [tryReadPaginationMeta](PaginationAdapter.md#tryreadpaginationmeta)
- [tryReadPaginationMetaFactory](PaginationAdapter.md#tryreadpaginationmetafactory)
- [updateOne](PaginationAdapter.md#updateone)
- [upsertOne](PaginationAdapter.md#upsertone)

## Properties

### initialState

• **initialState**: [`PaginationState`](PaginationState.md)<`Data`\>

#### Defined in

[adapters/paginationAdapter.ts:22](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L22)

## Methods

### appendPagination

▸ **appendPagination**(`draft`, `key`, `data`): `void`

Append the data to the pagination. If the pagination is not existed, create one.

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |
| `data` | `RawData`[] |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:93](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L93)

___

### createOne

▸ **createOne**(`draft`, `rawData`): `void`

Add the data to the state.

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `rawData` | `RawData` |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:26](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L26)

___

### deleteOne

▸ **deleteOne**(`draft`, `id`): `void`

Delete the entity with the specified id and remove the data from pagination (if existed).

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `id` | [`Id`](../README.md#id) |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:49](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L49)

___

### prependPagination

▸ **prependPagination**(`draft`, `key`, `data`): `void`

Prepend the data to the pagination. If the pagination is not existed, create one.

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |
| `data` | `RawData`[] |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:97](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L97)

___

### readOne

▸ **readOne**(`state`, `id`): `Data`

Read the data with the specify id. If the data is not existed, it will throw an error.
This function is useful when you are sure that the data is existed.

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `id` | [`Id`](../README.md#id) |

#### Returns

`Data`

#### Defined in

[adapters/paginationAdapter.ts:41](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L41)

___

### readPagination

▸ **readPagination**(`state`, `key`): [`Pagination`](Pagination.md)<`Data`\>

Read the pagination with the specified key. If the pagination is not existed, throw an error.
It is useful when you are sure that the pagination is existed.

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |

#### Returns

[`Pagination`](Pagination.md)<`Data`\>

#### Defined in

[adapters/paginationAdapter.ts:85](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L85)

___

### readPaginationMeta

▸ **readPaginationMeta**(`state`, `key`): [`PaginationMeta`](PaginationMeta.md)

Read the pagination meta with the specified key. If it is not existed, throw an error.
It is useful when you are sure that the pagination is existed.

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |

#### Returns

[`PaginationMeta`](PaginationMeta.md)

#### Defined in

[adapters/paginationAdapter.ts:69](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L69)

___

### replacePagination

▸ **replacePagination**(`draft`, `key`, `data`): `void`

Replace the whole pagination with the given data array.

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |
| `data` | `RawData`[] |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:89](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L89)

___

### setNoMore

▸ **setNoMore**(`draft`, `key`, `noMore`): `void`

Set the `noMore` property in the pagination meta.

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |
| `noMore` | `boolean` |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:101](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L101)

___

### sortPagination

▸ **sortPagination**(`draft`, `key`, `compare`): `void`

Sort the pagination by the `compare` function.

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |
| `compare` | (`a`: `Data`, `b`: `Data`) => `number` |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:105](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L105)

___

### tryReadOne

▸ **tryReadOne**(`state`, `id`): `undefined` \| `Data`

Try to read the data with the specified id.
If it is not existed, return `undefined`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `id` | [`Id`](../README.md#id) |

#### Returns

`undefined` \| `Data`

#### Defined in

[adapters/paginationAdapter.ts:31](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L31)

___

### tryReadOneFactory

▸ **tryReadOneFactory**(`id`): (`state`: [`PaginationState`](PaginationState.md)<`Data`\>) => `undefined` \| `Data`

Returns a function that accept a `state` as a parameter.
It is useful when you are using `useAccessor`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | [`Id`](../README.md#id) |

#### Returns

`fn`

▸ (`state`): `undefined` \| `Data`

Returns a function that accept a `state` as a parameter.
It is useful when you are using `useAccessor`.

##### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |

##### Returns

`undefined` \| `Data`

#### Defined in

[adapters/paginationAdapter.ts:36](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L36)

___

### tryReadPagination

▸ **tryReadPagination**(`state`, `key`): `undefined` \| [`Pagination`](Pagination.md)<`Data`\>

Try to read the pagination with the specified key. If it is not existed, return `undefined`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |

#### Returns

`undefined` \| [`Pagination`](Pagination.md)<`Data`\>

#### Defined in

[adapters/paginationAdapter.ts:73](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L73)

___

### tryReadPaginationFactory

▸ **tryReadPaginationFactory**(`key`): (`state`: [`PaginationState`](PaginationState.md)<`Data`\>) => `undefined` \| [`Pagination`](Pagination.md)<`Data`\>

Returns a function that accepts state as the only one parameter.
If is useful when using `useAccessor`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`fn`

▸ (`state`): `undefined` \| [`Pagination`](Pagination.md)<`Data`\>

Returns a function that accepts state as the only one parameter.
If is useful when using `useAccessor`.

##### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |

##### Returns

`undefined` \| [`Pagination`](Pagination.md)<`Data`\>

#### Defined in

[adapters/paginationAdapter.ts:78](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L78)

___

### tryReadPaginationMeta

▸ **tryReadPaginationMeta**(`state`, `key`): `undefined` \| [`PaginationMeta`](PaginationMeta.md)

Try to read the pagination meta. If the meta is not existed, return `undefined`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `key` | `string` |

#### Returns

`undefined` \| [`PaginationMeta`](PaginationMeta.md)

#### Defined in

[adapters/paginationAdapter.ts:57](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L57)

___

### tryReadPaginationMetaFactory

▸ **tryReadPaginationMetaFactory**(`key`): (`state`: [`PaginationState`](PaginationState.md)<`Data`\>) => `undefined` \| [`PaginationMeta`](PaginationMeta.md)

This function returns a function that accepts a state as the only one parameter.
It is useful when using `useAccessor`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`fn`

▸ (`state`): `undefined` \| [`PaginationMeta`](PaginationMeta.md)

This function returns a function that accepts a state as the only one parameter.
It is useful when using `useAccessor`.

##### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`PaginationState`](PaginationState.md)<`Data`\> |

##### Returns

`undefined` \| [`PaginationMeta`](PaginationMeta.md)

#### Defined in

[adapters/paginationAdapter.ts:62](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L62)

___

### updateOne

▸ **updateOne**(`draft`, `id`, `data`): `void`

Update the entity with the new data. If the entity is not existed, do nothing.

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `id` | [`Id`](../README.md#id) |
| `data` | `Partial`<`Data`\> |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:45](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L45)

___

### upsertOne

▸ **upsertOne**(`draft`, `rawData`): `void`

Update the entity with the data. If the entity is not existed, insert it to the state.

#### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | [`PaginationState`](PaginationState.md)<`Data`\> |
| `rawData` | `RawData` |

#### Returns

`void`

#### Defined in

[adapters/paginationAdapter.ts:53](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/adapters/paginationAdapter.ts#L53)
