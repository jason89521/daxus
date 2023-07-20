[daxus](../README.md) / AccessorOptions

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
- [placeholderData](AccessorOptions.md#placeholderdata)
- [pollingInterval](AccessorOptions.md#pollinginterval)
- [pollingWhenHidden](AccessorOptions.md#pollingwhenhidden)
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

**`Default Value`**

`(snapshot) => !isUndefined(snapshot)`

##### Parameters

| Name | Type |
| :------ | :------ |
| `snapshot` | `S` |

##### Returns

`boolean`

#### Defined in

[hooks/types.ts:31](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L31)

___

### dedupeInterval

• `Optional` **dedupeInterval**: `number`

The time span in milliseconds to deduplicate requests with the same accessor.

**`Default Value`**

`2000`

#### Defined in

[hooks/types.ts:46](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L46)

___

### keepPreviousData

• `Optional` **keepPreviousData**: `boolean`

Return the previous data until the new data has been fetched.

**`Default Value`**

`false`

#### Defined in

[hooks/types.ts:56](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L56)

___

### placeholderData

• `Optional` **placeholderData**: `S`

#### Defined in

[hooks/types.ts:57](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L57)

___

### pollingInterval

• `Optional` **pollingInterval**: `number`

The interval in milliseconds for polling data. If the value is less than or equal to 0, polling is disabled.

**`Default Value`**

`0`

#### Defined in

[hooks/types.ts:51](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L51)

___

### pollingWhenHidden

• `Optional` **pollingWhenHidden**: `boolean`

#### Defined in

[hooks/types.ts:58](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L58)

___

### retryCount

• `Optional` **retryCount**: `number`

The number of retry attempts for errors.

**`Default Value`**

`3`

#### Defined in

[hooks/types.ts:36](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L36)

___

### retryInterval

• `Optional` **retryInterval**: `number`

The interval in milliseconds between retry attempts for errors.

**`Default Value`**

`1000`

#### Defined in

[hooks/types.ts:41](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L41)

___

### revalidateIfStale

• `Optional` **revalidateIfStale**: `boolean`

Whether it should revalidate when the accessor is stale.

**`Default Value`**

`false`

#### Defined in

[hooks/types.ts:26](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L26)

___

### revalidateOnFocus

• `Optional` **revalidateOnFocus**: `boolean`

Whether the accessor should revalidate data when the user refocuses the page.

**`Default Value`**

`false`

#### Defined in

[hooks/types.ts:11](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L11)

___

### revalidateOnMount

• `Optional` **revalidateOnMount**: `boolean`

Whether it should revalidate when the `accessor` changes.

**`Default Value`**

`false`

#### Defined in

[hooks/types.ts:21](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L21)

___

### revalidateOnReconnect

• `Optional` **revalidateOnReconnect**: `boolean`

Whether the accessor should revalidate data when the user reconnects to the network.

**`Default Value`**

`false`

#### Defined in

[hooks/types.ts:16](https://github.com/jason89521/react-fetch/blob/6d3292c/src/lib/hooks/types.ts#L16)
