[daxus](../README.md) / Accessor

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

- [invalidate](Accessor.md#invalidate)

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

[model/Accessor.ts:44](https://github.com/jason89521/react-fetch/blob/6ec4382/src/lib/model/Accessor.ts#L44)

___

### revalidate

• `Abstract` **revalidate**: () => `Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

#### Type declaration

▸ (): `Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

Return the result of the revalidation.

##### Returns

`Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `D`\>\>

#### Defined in

[model/Accessor.ts:39](https://github.com/jason89521/react-fetch/blob/6ec4382/src/lib/model/Accessor.ts#L39)

## Methods

### invalidate

▸ **invalidate**(): `void`

#### Returns

`void`

#### Defined in

[model/Accessor.ts:128](https://github.com/jason89521/react-fetch/blob/6ec4382/src/lib/model/Accessor.ts#L128)
