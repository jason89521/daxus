[daxus](../README.md) / Accessor

# Class: Accessor<S, D, E, Arg\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `D` | `D` |
| `E` | `E` |
| `Arg` | `unknown` |

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

[model/Accessor.ts:50](https://github.com/jason89521/react-fetch/blob/6f430a6/src/lib/model/Accessor.ts#L50)

___

### revalidate

• `Abstract` **revalidate**: () => `Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

#### Type declaration

▸ (): `Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

Return the result of the revalidation.

##### Returns

`Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

#### Defined in

[model/Accessor.ts:45](https://github.com/jason89521/react-fetch/blob/6f430a6/src/lib/model/Accessor.ts#L45)

## Methods

### getKey

▸ **getKey**(): `string`

#### Returns

`string`

#### Defined in

[model/Accessor.ts:85](https://github.com/jason89521/react-fetch/blob/6f430a6/src/lib/model/Accessor.ts#L85)

___

### invalidate

▸ **invalidate**(): `void`

#### Returns

`void`

#### Defined in

[model/Accessor.ts:160](https://github.com/jason89521/react-fetch/blob/6f430a6/src/lib/model/Accessor.ts#L160)

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

[model/Accessor.ts:140](https://github.com/jason89521/react-fetch/blob/6f430a6/src/lib/model/Accessor.ts#L140)
