[react-server-model](../README.md) / AccessorOptions

# Interface: AccessorOptions<S\>

## Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `S` | `any` | The snapshot of the state. |

## Table of contents

### Properties

- [checkHasData](AccessorOptions.md#checkhasdata)
- [dedupeInterval](AccessorOptions.md#dedupeinterval)
- [keepPreviousData](AccessorOptions.md#keeppreviousdata)
- [pollingInterval](AccessorOptions.md#pollinginterval)
- [retryCount](AccessorOptions.md#retrycount)
- [retryInterval](AccessorOptions.md#retryinterval)
- [revalidateIfStale](AccessorOptions.md#revalidateifstale)
- [revalidateOnFocus](AccessorOptions.md#revalidateonfocus)
- [revalidateOnMount](AccessorOptions.md#revalidateonmount)
- [revalidateOnReconnect](AccessorOptions.md#revalidateonreconnect)

## Properties

### checkHasData

• `Optional` **checkHasData**: (`snapshot`: `S`) => `boolean`

#### Type declaration

▸ (`snapshot`): `boolean`

A function to determine whether the returned data from the `getSnapshot` function is what you want. If it isn't, then it will revalidate.

##### Parameters

| Name | Type |
| :------ | :------ |
| `snapshot` | `S` |

##### Returns

`boolean`

#### Defined in

[hooks/types.ts:26](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L26)

___

### dedupeInterval

• `Optional` **dedupeInterval**: `number`

The time span in milliseconds to deduplicate requests with the same accessor.

#### Defined in

[hooks/types.ts:38](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L38)

___

### keepPreviousData

• `Optional` **keepPreviousData**: `boolean`

Return the previous data until the new data has been fetched.

#### Defined in

[hooks/types.ts:46](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L46)

___

### pollingInterval

• `Optional` **pollingInterval**: `number`

The interval in milliseconds for polling data. If the value is less than or equal to 0, polling is disabled.

#### Defined in

[hooks/types.ts:42](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L42)

___

### retryCount

• `Optional` **retryCount**: `number`

The number of retry attempts for errors.

#### Defined in

[hooks/types.ts:30](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L30)

___

### retryInterval

• `Optional` **retryInterval**: `number`

The interval in milliseconds between retry attempts for errors.

#### Defined in

[hooks/types.ts:34](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L34)

___

### revalidateIfStale

• `Optional` **revalidateIfStale**: `boolean`

Whether it should revalidate when the data, for which the `accessor` is responsible for fetching, is stale.

#### Defined in

[hooks/types.ts:22](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L22)

___

### revalidateOnFocus

• `Optional` **revalidateOnFocus**: `boolean`

Whether the accessor should revalidate data when the user refocuses the page.

#### Defined in

[hooks/types.ts:10](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L10)

___

### revalidateOnMount

• `Optional` **revalidateOnMount**: `boolean`

Whether it should revalidate when the `accessor` changes.

#### Defined in

[hooks/types.ts:18](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L18)

___

### revalidateOnReconnect

• `Optional` **revalidateOnReconnect**: `boolean`

Whether the accessor should revalidate data when the user reconnects to the network.

#### Defined in

[hooks/types.ts:14](https://github.com/jason89521/react-fetch/blob/1201b7b/src/lib/hooks/types.ts#L14)
