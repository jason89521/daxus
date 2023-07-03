[react-server-model](../README.md) / Accessor

# Class: Accessor<S, D, E\>

## Type parameters

| Name |
| :------ |
| `S` |
| `D` |
| `E` |

## Hierarchy

- **`Accessor`**

  ↳ [`NormalAccessor`](NormalAccessor.md)

  ↳ [`InfiniteAccessor`](InfiniteAccessor.md)

## Table of contents

### Properties

- [getState](Accessor.md#getstate)
- [revalidate](Accessor.md#revalidate)

### Methods

- [getIsStale](Accessor.md#getisstale)
- [setIsStale](Accessor.md#setisstale)

## Properties

### getState

• **getState**: () => `S`

#### Type declaration

▸ (): `S`

Get the state of the corresponding model.

##### Returns

`S`

#### Defined in

[model/Accessor.ts:45](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/Accessor.ts#L45)

___

### revalidate

• `Abstract` **revalidate**: () => ``null`` \| `Promise`<``null`` \| `D`\>

#### Type declaration

▸ (): ``null`` \| `Promise`<``null`` \| `D`\>

Return the result of the revalidation. It may be `null` if the revalidation is aborted or encounters an error.

##### Returns

``null`` \| `Promise`<``null`` \| `D`\>

#### Defined in

[model/Accessor.ts:40](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/Accessor.ts#L40)

## Methods

### getIsStale

▸ **getIsStale**(): `boolean`

Get whether this accessor is stale or not.

#### Returns

`boolean`

#### Defined in

[model/Accessor.ts:123](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/Accessor.ts#L123)

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

#### Defined in

[model/Accessor.ts:130](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/Accessor.ts#L130)
