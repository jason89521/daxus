[react-server-model](../README.md) / NormalAccessor

# Class: NormalAccessor<S, Arg, Data, E\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `Arg` | `any` |
| `Data` | `any` |
| `E` | `unknown` |

## Hierarchy

- [`Accessor`](Accessor.md)<`S`, `Data`, `E`\>

  ↳ **`NormalAccessor`**

## Table of contents

### Properties

- [getState](NormalAccessor.md#getstate)

### Methods

- [getIsStale](NormalAccessor.md#getisstale)
- [revalidate](NormalAccessor.md#revalidate)
- [setIsStale](NormalAccessor.md#setisstale)

## Properties

### getState

• **getState**: () => `S`

#### Type declaration

▸ (): `S`

Get the state of the corresponding model.

##### Returns

`S`

#### Inherited from

[Accessor](Accessor.md).[getState](Accessor.md#getstate)

#### Defined in

[model/Accessor.ts:45](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/Accessor.ts#L45)

## Methods

### getIsStale

▸ **getIsStale**(): `boolean`

Get whether this accessor is stale or not.

#### Returns

`boolean`

#### Inherited from

[Accessor](Accessor.md).[getIsStale](Accessor.md#getisstale)

#### Defined in

[model/Accessor.ts:123](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/Accessor.ts#L123)

___

### revalidate

▸ **revalidate**(): `Promise`<``null`` \| `Data`\>

Revalidate the data.

#### Returns

`Promise`<``null`` \| `Data`\>

The data fetched by the accessor if it is not interrupted. Otherwise returns `null`.

#### Overrides

Accessor.revalidate

#### Defined in

[model/NormalAccessor.ts:40](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/NormalAccessor.ts#L40)

___

### setIsStale

▸ **setIsStale**(`isStale`): `void`

Set the accessor to be stale.

#### Parameters

| Name | Type |
| :------ | :------ |
| `isStale` | `boolean` |

#### Returns

`void`

#### Inherited from

[Accessor](Accessor.md).[setIsStale](Accessor.md#setisstale)

#### Defined in

[model/Accessor.ts:130](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/Accessor.ts#L130)
