[react-server-model](../README.md) / NormalAccessorCreator

# Interface: NormalAccessorCreator<S, Arg, Data\>

## Type parameters

| Name |
| :------ |
| `S` |
| `Arg` |
| `Data` |

## Hierarchy

- `BaseAccessorCreator`

  ↳ **`NormalAccessorCreator`**

## Callable

### NormalAccessorCreator

▸ **NormalAccessorCreator**(`arg`): [`NormalAccessor`](../classes/NormalAccessor.md)<`S`, `Arg`, `Data`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Arg` |

#### Returns

[`NormalAccessor`](../classes/NormalAccessor.md)<`S`, `Arg`, `Data`, `unknown`\>

#### Defined in

[model/Model.ts:12](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/model/Model.ts#L12)

## Table of contents

### Methods

- [setIsStale](NormalAccessorCreator.md#setisstale)

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
