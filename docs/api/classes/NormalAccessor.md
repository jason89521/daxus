[daxus](../README.md) / NormalAccessor

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

- [invalidate](NormalAccessor.md#invalidate)
- [revalidate](NormalAccessor.md#revalidate)

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

#### Inherited from

[Accessor](Accessor.md).[getState](Accessor.md#getstate)

#### Defined in

[model/Accessor.ts:44](https://github.com/jason89521/react-fetch/blob/6ec4382/src/lib/model/Accessor.ts#L44)

## Methods

### invalidate

▸ **invalidate**(): `void`

#### Returns

`void`

#### Inherited from

[Accessor](Accessor.md).[invalidate](Accessor.md#invalidate)

#### Defined in

[model/Accessor.ts:128](https://github.com/jason89521/react-fetch/blob/6ec4382/src/lib/model/Accessor.ts#L128)

___

### revalidate

▸ **revalidate**(): `Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `Data`\>\>

Return the result of the revalidation.

#### Returns

`Promise`<[`FetchPromiseResult`](../README.md#fetchpromiseresult)<`E`, `Data`\>\>

#### Overrides

Accessor.revalidate

#### Defined in

[model/NormalAccessor.ts:39](https://github.com/jason89521/react-fetch/blob/6ec4382/src/lib/model/NormalAccessor.ts#L39)
