[daxus](../README.md) / InfiniteAccessor

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
- [invalidate](InfiniteAccessor.md#invalidate)
- [revalidate](InfiniteAccessor.md#revalidate)

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

[model/Accessor.ts:42](https://github.com/jason89521/react-fetch/blob/1011800/src/lib/model/Accessor.ts#L42)

## Methods

### fetchNext

▸ **fetchNext**(): `Promise`<``null`` \| `Data`[]\>

Fetch the next page.

#### Returns

`Promise`<``null`` \| `Data`[]\>

The all pages if it is not interrupted by the other revalidation, otherwise returns `null`.

#### Defined in

[model/InfiniteAccessor.ts:58](https://github.com/jason89521/react-fetch/blob/1011800/src/lib/model/InfiniteAccessor.ts#L58)

___

### invalidate

▸ **invalidate**(): `void`

#### Returns

`void`

#### Inherited from

[Accessor](Accessor.md).[invalidate](Accessor.md#invalidate)

#### Defined in

[model/Accessor.ts:126](https://github.com/jason89521/react-fetch/blob/1011800/src/lib/model/Accessor.ts#L126)

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

[model/InfiniteAccessor.ts:49](https://github.com/jason89521/react-fetch/blob/1011800/src/lib/model/InfiniteAccessor.ts#L49)
