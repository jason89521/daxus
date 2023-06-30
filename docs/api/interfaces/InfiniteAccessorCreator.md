[react-server-model](../README.md) / InfiniteAccessorCreator

# Interface: InfiniteAccessorCreator<S, Arg, Data\>

## Type parameters

| Name |
| :------ |
| `S` |
| `Arg` |
| `Data` |

## Hierarchy

- `BaseAccessorCreator`

  ↳ **`InfiniteAccessorCreator`**

## Callable

### InfiniteAccessorCreator

▸ **InfiniteAccessorCreator**(`arg`): [`InfiniteAccessor`](../classes/InfiniteAccessor.md)<`S`, `Arg`, `Data`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Arg` |

#### Returns

[`InfiniteAccessor`](../classes/InfiniteAccessor.md)<`S`, `Arg`, `Data`, `unknown`\>

#### Defined in

[model/Model.ts:15](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/model/Model.ts#L15)

## Table of contents

### Methods

- [setIsStale](InfiniteAccessorCreator.md#setisstale)

## Methods

### setIsStale

▸ **setIsStale**(`isStale`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `isStale` | `boolean` |

#### Returns

`void`

#### Inherited from

BaseAccessorCreator.setIsStale

#### Defined in

[model/Model.ts:9](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/model/Model.ts#L9)
