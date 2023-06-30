[react-server-model](../README.md) / InfiniteAccessor

# Class: InfiniteAccessor<S, Arg, Data, E\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `Arg` | `any` |
| `Data` | `any` |
| `E` | `unknown` |

## Hierarchy

- [`Accessor`](Accessor.md)<`S`, `Data`[], `E`\>

  ↳ **`InfiniteAccessor`**

## Table of contents

### Properties

- [getState](InfiniteAccessor.md#getstate)

### Methods

- [fetchNext](InfiniteAccessor.md#fetchnext)
- [getIsStale](InfiniteAccessor.md#getisstale)
- [revalidate](InfiniteAccessor.md#revalidate)
- [setIsStale](InfiniteAccessor.md#setisstale)

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

[model/Accessor.ts:45](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/model/Accessor.ts#L45)

## Methods

### fetchNext

▸ **fetchNext**(): `Promise`<``null`` \| `Data`[]\>

Fetch the next page.

#### Returns

`Promise`<``null`` \| `Data`[]\>

The all pages if it is not interrupted by the other revalidation, otherwise returns `null`.

#### Defined in

[model/InfiniteAccessor.ts:58](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/model/InfiniteAccessor.ts#L58)

___

### getIsStale

▸ **getIsStale**(): `boolean`

Get whether this accessor is stale or not.

#### Returns

`boolean`

#### Inherited from

[Accessor](Accessor.md).[getIsStale](Accessor.md#getisstale)

#### Defined in

[model/Accessor.ts:123](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/model/Accessor.ts#L123)

___

### revalidate

▸ **revalidate**(): `Promise`<``null`` \| `Data`[]\>

Revalidate the all pages.

#### Returns

`Promise`<``null`` \| `Data`[]\>

The all pages if it is not interrupted by the other revalidation, otherwise returns `null.

#### Overrides

Accessor.revalidate

#### Defined in

[model/InfiniteAccessor.ts:49](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/model/InfiniteAccessor.ts#L49)

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

[model/Accessor.ts:130](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/model/Accessor.ts#L130)
