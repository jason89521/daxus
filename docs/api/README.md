daxus

# daxus

## Table of contents

### Classes

- [Accessor](classes/Accessor.md)
- [InfiniteAccessor](classes/InfiniteAccessor.md)
- [NormalAccessor](classes/NormalAccessor.md)

### Interfaces

- [AccessorOptions](interfaces/AccessorOptions.md)
- [AccessorOptionsProviderProps](interfaces/AccessorOptionsProviderProps.md)
- [InfiniteAccessorCreator](interfaces/InfiniteAccessorCreator.md)
- [InfiniteAction](interfaces/InfiniteAction.md)
- [NormalAccessorCreator](interfaces/NormalAccessorCreator.md)
- [NormalAction](interfaces/NormalAction.md)
- [Pagination](interfaces/Pagination.md)
- [PaginationAdapter](interfaces/PaginationAdapter.md)
- [PaginationMeta](interfaces/PaginationMeta.md)
- [PaginationState](interfaces/PaginationState.md)
- [ServerStateKeyProviderProps](interfaces/ServerStateKeyProviderProps.md)

### Type Aliases

- [Id](README.md#id)
- [UseAccessorReturn](README.md#useaccessorreturn)

### Functions

- [AccessorOptionsProvider](README.md#accessoroptionsprovider)
- [ServerStateKeyProvider](README.md#serverstatekeyprovider)
- [createModel](README.md#createmodel)
- [createPaginationAdapter](README.md#createpaginationadapter)
- [useAccessor](README.md#useaccessor)
- [useHydrate](README.md#usehydrate)
- [useServerStateKeyContext](README.md#useserverstatekeycontext)

## Type Aliases

### Id

Ƭ **Id**: `string` \| `number`

#### Defined in

[adapters/paginationAdapter.ts:3](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/adapters/paginationAdapter.ts#L3)

___

### UseAccessorReturn

Ƭ **UseAccessorReturn**<`S`, `E`, `ACC`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `E` | `E` |
| `ACC` | extends [`Accessor`](classes/Accessor.md)<`any`, `any`, `E`\> \| ``null`` |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `accessor` | `ACC` | The accessor passed to the `useAccessor`. |
| `data` | `S` | The snapshot returned by the `getSnapshot` function. |
| `error` | `E` \| ``null`` | The error thrown by the `fetchData` defined in the accessor. It is set when all retry attempts fail. |
| `isFetching` | `boolean` | Whether the accessor is currently fetching data. |
| `isLoading` | `boolean` | `true` if the `checkHasData` return `false` and the accessor is fetching data. |

#### Defined in

[hooks/types.ts:61](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/hooks/types.ts#L61)

## Functions

### AccessorOptionsProvider

▸ **AccessorOptionsProvider**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`AccessorOptionsProviderProps`](interfaces/AccessorOptionsProviderProps.md) |

#### Returns

`Element`

#### Defined in

[contexts/AccessorOptionsContext.tsx:14](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/contexts/AccessorOptionsContext.tsx#L14)

___

### ServerStateKeyProvider

▸ **ServerStateKeyProvider**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ServerStateKeyProviderProps`](interfaces/ServerStateKeyProviderProps.md) |

#### Returns

`Element`

#### Defined in

[contexts/ServerStateKeyContext.tsx:14](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/contexts/ServerStateKeyContext.tsx#L14)

___

### createModel

▸ **createModel**<`S`\>(`initialState`): `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `initialState` | `S` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `defineInfiniteAccessor` | <Arg, Data, E\>(`action`: [`InfiniteAction`](interfaces/InfiniteAction.md)<`S`, `Arg`, `Data`, `E`\>) => [`InfiniteAccessorCreator`](interfaces/InfiniteAccessorCreator.md)<`S`, `Arg`, `Data`, `E`\> |
| `defineNormalAccessor` | <Arg, Data, E\>(`action`: [`NormalAction`](interfaces/NormalAction.md)<`S`, `Arg`, `Data`, `E`\>) => [`NormalAccessorCreator`](interfaces/NormalAccessorCreator.md)<`S`, `Arg`, `Data`, `E`\> |
| `getState` | (`serverStateKey?`: `object`) => `S` |
| `invalidate` | () => `void` |
| `mutate` | (`fn`: (`draft`: `Draft`<`S`\>) => `void`, `serverStateKey?`: `object`) => `void` |

#### Defined in

[model/Model.ts:18](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/model/Model.ts#L18)

___

### createPaginationAdapter

▸ **createPaginationAdapter**<`Data`, `RawData`\>(`«destructured»?`): [`PaginationAdapter`](interfaces/PaginationAdapter.md)<`Data`, `RawData`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `RawData` | `Data` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `getId?` | (`data`: `Data`) => [`Id`](README.md#id) |
| › `transform?` | (`rawData`: `RawData`) => `Data` |

#### Returns

[`PaginationAdapter`](interfaces/PaginationAdapter.md)<`Data`, `RawData`\>

#### Defined in

[adapters/paginationAdapter.ts:130](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/adapters/paginationAdapter.ts#L130)

___

### useAccessor

▸ **useAccessor**<`S`, `Arg`, `RD`, `SS`, `E`\>(`accessor`, `getSnapshot`, `options?`): [`UseAccessorReturn`](README.md#useaccessorreturn)<`SS`, `E`, [`NormalAccessor`](classes/NormalAccessor.md)<`S`, `Arg`, `RD`, `E`\>\>

`useAccessor` hook provides a way to access and manage data fetched by an accessor.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `Arg` | `Arg` |
| `RD` | `RD` |
| `SS` | `SS` |
| `E` | `unknown` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accessor` | [`NormalAccessor`](classes/NormalAccessor.md)<`S`, `Arg`, `RD`, `E`\> | A normal accessor. |
| `getSnapshot` | (`state`: `S`) => `SS` | A function that accepts the state of the `accessor`'s model and returns the desired data. |
| `options?` | [`AccessorOptions`](interfaces/AccessorOptions.md)<`SS`\> | Additional options for controlling the behavior of the accessor. |

#### Returns

[`UseAccessorReturn`](README.md#useaccessorreturn)<`SS`, `E`, [`NormalAccessor`](classes/NormalAccessor.md)<`S`, `Arg`, `RD`, `E`\>\>

#### Defined in

[hooks/useAccessor.ts:18](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/hooks/useAccessor.ts#L18)

▸ **useAccessor**<`S`, `Arg`, `RD`, `SS`, `E`\>(`accessor`, `getSnapshot`, `options?`): [`UseAccessorReturn`](README.md#useaccessorreturn)<`SS` \| `undefined`, `E`, [`NormalAccessor`](classes/NormalAccessor.md)<`S`, `Arg`, `RD`, `E`\> \| ``null``\>

`useAccessor` hook provides a way to access and manage data fetched by an accessor.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `Arg` | `Arg` |
| `RD` | `RD` |
| `SS` | `SS` |
| `E` | `unknown` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accessor` | ``null`` \| [`NormalAccessor`](classes/NormalAccessor.md)<`S`, `Arg`, `RD`, `E`\> | A normal accessor or `null`. It is useful when you want conditional fetching. |
| `getSnapshot` | (`state`: `S`) => `SS` | A function that accepts the state of the `accessor`'s model and returns the desired data. |
| `options?` | [`AccessorOptions`](interfaces/AccessorOptions.md)<`SS`\> | Additional options for controlling the behavior of the accessor. |

#### Returns

[`UseAccessorReturn`](README.md#useaccessorreturn)<`SS` \| `undefined`, `E`, [`NormalAccessor`](classes/NormalAccessor.md)<`S`, `Arg`, `RD`, `E`\> \| ``null``\>

#### Defined in

[hooks/useAccessor.ts:29](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/hooks/useAccessor.ts#L29)

▸ **useAccessor**<`S`, `Arg`, `RD`, `SS`, `E`\>(`accessor`, `getSnapshot`, `options?`): [`UseAccessorReturn`](README.md#useaccessorreturn)<`SS`, `E`, [`InfiniteAccessor`](classes/InfiniteAccessor.md)<`S`, `Arg`, `RD`, `E`\>\>

`useAccessor` hook provides a way to access and manage data fetched by an accessor.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `Arg` | `Arg` |
| `RD` | `RD` |
| `SS` | `SS` |
| `E` | `unknown` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accessor` | [`InfiniteAccessor`](classes/InfiniteAccessor.md)<`S`, `Arg`, `RD`, `E`\> | A infinite accessor. |
| `getSnapshot` | (`state`: `S`) => `SS` | A function that accepts the state of the `accessor`'s model and returns the desired data. |
| `options?` | [`AccessorOptions`](interfaces/AccessorOptions.md)<`SS`\> | Additional options for controlling the behavior of the accessor. |

#### Returns

[`UseAccessorReturn`](README.md#useaccessorreturn)<`SS`, `E`, [`InfiniteAccessor`](classes/InfiniteAccessor.md)<`S`, `Arg`, `RD`, `E`\>\>

#### Defined in

[hooks/useAccessor.ts:40](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/hooks/useAccessor.ts#L40)

▸ **useAccessor**<`S`, `Arg`, `RD`, `SS`, `E`\>(`accessor`, `getSnapshot`, `options?`): [`UseAccessorReturn`](README.md#useaccessorreturn)<`SS` \| `undefined`, `E`, [`InfiniteAccessor`](classes/InfiniteAccessor.md)<`S`, `Arg`, `RD`, `E`\> \| ``null``\>

`useAccessor` hook provides a way to access and manage data fetched by an accessor.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `Arg` | `Arg` |
| `RD` | `RD` |
| `SS` | `SS` |
| `E` | `unknown` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accessor` | ``null`` \| [`InfiniteAccessor`](classes/InfiniteAccessor.md)<`S`, `Arg`, `RD`, `E`\> | A infinite accessor or `null`. It is useful when you want conditional fetching. |
| `getSnapshot` | (`state`: `S`) => `SS` | A function that accepts the state of the `accessor`'s model and returns the desired data. |
| `options?` | [`AccessorOptions`](interfaces/AccessorOptions.md)<`SS`\> | Additional options for controlling the behavior of the accessor. |

#### Returns

[`UseAccessorReturn`](README.md#useaccessorreturn)<`SS` \| `undefined`, `E`, [`InfiniteAccessor`](classes/InfiniteAccessor.md)<`S`, `Arg`, `RD`, `E`\> \| ``null``\>

#### Defined in

[hooks/useAccessor.ts:51](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/hooks/useAccessor.ts#L51)

___

### useHydrate

▸ **useHydrate**<`T`\>(`data`, `update`): `void`

This function will call the `update` when the data change.
You can use it for server side render.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `T` | This data will be store in a weak set, if it doesn't appear in the weak set, the `update` function will be invoked. |
| `update` | (`serverStateKey?`: `object`) => `void` | A function which receive a server state key. You should pass this key when you mutate any model. |

#### Returns

`void`

#### Defined in

[hooks/useHydrate.ts:12](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/hooks/useHydrate.ts#L12)

___

### useServerStateKeyContext

▸ **useServerStateKeyContext**(): `object`

#### Returns

`object`

#### Defined in

[contexts/ServerStateKeyContext.tsx:10](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/contexts/ServerStateKeyContext.tsx#L10)
