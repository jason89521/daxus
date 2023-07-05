[daxus](../README.md) / NormalAction

# Interface: NormalAction<S, Arg, Data, E\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `Arg` | `any` |
| `Data` | `any` |
| `E` | `unknown` |

## Hierarchy

- `BaseAction`<`Arg`, `Data`, `E`\>

  ↳ **`NormalAction`**

## Table of contents

### Properties

- [fetchData](NormalAction.md#fetchdata)
- [onError](NormalAction.md#onerror)
- [onSuccess](NormalAction.md#onsuccess)
- [syncState](NormalAction.md#syncstate)

## Properties

### fetchData

• **fetchData**: (`arg`: `Arg`) => `Promise`<`Data`\>

#### Type declaration

▸ (`arg`): `Promise`<`Data`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Arg` |

##### Returns

`Promise`<`Data`\>

#### Defined in

[model/types.ts:10](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/model/types.ts#L10)

___

### onError

• `Optional` **onError**: (`info`: { `arg`: `Arg` ; `error`: `E`  }) => `void`

#### Type declaration

▸ (`info`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `info` | `Object` |
| `info.arg` | `Arg` |
| `info.error` | `E` |

##### Returns

`void`

#### Inherited from

BaseAction.onError

#### Defined in

[model/types.ts:4](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/model/types.ts#L4)

___

### onSuccess

• `Optional` **onSuccess**: (`info`: { `arg`: `Arg` ; `data`: `Data`  }) => `void`

#### Type declaration

▸ (`info`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `info` | `Object` |
| `info.arg` | `Arg` |
| `info.data` | `Data` |

##### Returns

`void`

#### Inherited from

BaseAction.onSuccess

#### Defined in

[model/types.ts:5](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/model/types.ts#L5)

___

### syncState

• **syncState**: (`draft`: `Draft`<`S`\>, `payload`: { `arg`: `Arg` ; `data`: `Data` ; `startAt`: `number`  }) => `void`

#### Type declaration

▸ (`draft`, `payload`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | `Draft`<`S`\> |
| `payload` | `Object` |
| `payload.arg` | `Arg` |
| `payload.data` | `Data` |
| `payload.startAt` | `number` |

##### Returns

`void`

#### Defined in

[model/types.ts:11](https://github.com/jason89521/react-fetch/blob/9f24fa5/src/lib/model/types.ts#L11)
