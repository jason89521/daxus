[react-server-model](../README.md) / InfiniteAction

# Interface: InfiniteAction<S, Arg, Data, E\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `S` | `S` |
| `Arg` | `any` |
| `Data` | `any` |
| `E` | `unknown` |

## Hierarchy

- `BaseAction`<`Arg`, `Data`[], `E`\>

  ↳ **`InfiniteAction`**

## Table of contents

### Properties

- [fetchData](InfiniteAction.md#fetchdata)
- [onError](InfiniteAction.md#onerror)
- [onSuccess](InfiniteAction.md#onsuccess)
- [syncState](InfiniteAction.md#syncstate)

## Properties

### fetchData

• **fetchData**: (`arg`: `Arg`, `meta`: { `pageIndex`: `number` ; `previousData`: ``null`` \| `Data`  }) => `Promise`<``null`` \| `Data`\>

#### Type declaration

▸ (`arg`, `meta`): `Promise`<``null`` \| `Data`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Arg` |
| `meta` | `Object` |
| `meta.pageIndex` | `number` |
| `meta.previousData` | ``null`` \| `Data` |

##### Returns

`Promise`<``null`` \| `Data`\>

#### Defined in

[model/types.ts:23](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/types.ts#L23)

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

[model/types.ts:4](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/types.ts#L4)

___

### onSuccess

• `Optional` **onSuccess**: (`info`: { `arg`: `Arg` ; `data`: `Data`[]  }) => `void`

#### Type declaration

▸ (`info`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `info` | `Object` |
| `info.arg` | `Arg` |
| `info.data` | `Data`[] |

##### Returns

`void`

#### Inherited from

BaseAction.onSuccess

#### Defined in

[model/types.ts:5](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/types.ts#L5)

___

### syncState

• **syncState**: (`draft`: `Draft`<`S`\>, `payload`: { `arg`: `Arg` ; `data`: `Data` ; `pageIndex`: `number` ; `pageSize`: `number`  }) => `void`

#### Type declaration

▸ (`draft`, `payload`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `draft` | `Draft`<`S`\> |
| `payload` | `Object` |
| `payload.arg` | `Arg` |
| `payload.data` | `Data` |
| `payload.pageIndex` | `number` |
| `payload.pageSize` | `number` |

##### Returns

`void`

#### Defined in

[model/types.ts:27](https://github.com/jason89521/react-fetch/blob/450654d/src/lib/model/types.ts#L27)
