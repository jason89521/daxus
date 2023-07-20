[daxus](../README.md) / Accessor

# Class: Accessor<S, Arg, D, E\>

## Type parameters

| Name |
| :------ |
| `S` |
| `Arg` |
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

- [getKey](Accessor.md#getkey)
- [invalidate](Accessor.md#invalidate)
- [subscribeData](Accessor.md#subscribedata)

## Properties

### getState

• **getState**: (`serverStateKey?`: `object`) => `S`

#### Type declaration

▸ (`serverStateKey?`): `S`

Get the state of the corresponding model.

##### Parameters

| Name | Type |
| :------ | :------ |
| `serverStateKey?` | `object` |

##### Returns

`S`

#### Defined in

[model/Accessor.ts:59](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/model/Accessor.ts#L59)

___

### revalidate

• `Abstract` **revalidate**: () => `Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

#### Type declaration

▸ (): `Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

Return the result of the revalidation.

##### Returns

`Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

#### Defined in

[model/Accessor.ts:52](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/model/Accessor.ts#L52)

## Methods

### getKey

▸ **getKey**(): `string`

#### Returns

`string`

#### Defined in

[model/Accessor.ts:94](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/model/Accessor.ts#L94)

___

### invalidate

▸ **invalidate**(): `void`

#### Returns

`void`

#### Defined in

[model/Accessor.ts:164](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/model/Accessor.ts#L164)

___

### subscribeData

▸ **subscribeData**(`listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | () => `void` |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Defined in

[model/Accessor.ts:144](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/model/Accessor.ts#L144)
