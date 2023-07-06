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

[model/Accessor.ts:42](https://github.com/jason89521/react-fetch/blob/1693949/src/lib/model/Accessor.ts#L42)

## Methods

### invalidate

▸ **invalidate**(): `void`

#### Returns

`void`

#### Inherited from

[Accessor](Accessor.md).[invalidate](Accessor.md#invalidate)

#### Defined in

[model/Accessor.ts:126](https://github.com/jason89521/react-fetch/blob/1693949/src/lib/model/Accessor.ts#L126)

___

### revalidate

▸ **revalidate**(): `Promise`<readonly [``null`` \| `Data`, ``null`` \| `E`]\>

Return the result of the revalidation.

#### Returns

`Promise`<readonly [``null`` \| `Data`, ``null`` \| `E`]\>

#### Overrides

Accessor.revalidate

#### Defined in

[model/NormalAccessor.ts:39](https://github.com/jason89521/react-fetch/blob/1693949/src/lib/model/NormalAccessor.ts#L39)
