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

[model/Accessor.ts:42](https://github.com/jason89521/react-fetch/blob/27b98d0/src/lib/model/Accessor.ts#L42)

___

### revalidate

• `Abstract` **revalidate**: () => ``null`` \| `Promise`<``null`` \| `D`\>

#### Type declaration

▸ (): ``null`` \| `Promise`<``null`` \| `D`\>

Return the result of the revalidation. It may be `null` if the revalidation is aborted or encounters an error.

##### Returns

``null`` \| `Promise`<``null`` \| `D`\>

#### Defined in

[model/Accessor.ts:37](https://github.com/jason89521/react-fetch/blob/27b98d0/src/lib/model/Accessor.ts#L37)

## Methods

### invalidate

▸ **invalidate**(): `void`

#### Returns

`void`

#### Defined in

[model/Accessor.ts:126](https://github.com/jason89521/react-fetch/blob/27b98d0/src/lib/model/Accessor.ts#L126)
