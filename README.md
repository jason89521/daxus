# Daxus

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![PR's Welcome][pr-welcoming-image]][pr-welcoming-url]
[![Test coverage][codecov-image]][codecov-url]

Daxus is a server state management library for React that provides full control over data, leading to a better user experience.

- Customizable data structure
- Auto deduplication
- Revalidate on Focus
- Revalidate on network reconnection
- Polling support
- Pre-built pagination adapter
- Easy mutation
- Written in Typescript

---

- [Comparison](#comparison)
- [Installation](#installation)
- [Simple Example](#simple-example)
  - [Other Examples](#other-examples)
- [Tutorial](#tutorial)
  - [Pagination Data](#pagination-data)
  - [Auto Model](#auto-model)
  - [Invalidation](#invalidation)
- [Documents](#documents)
- [Development Motivation](#development-motivation)
  - [Why not use React Query?](#why-not-use-react-query)
  - [Goals to achieve](#goals-to-achieve)
- [Design Philosophy](#design-philosophy)

## Comparison

[The difference with React Query](./docs/the-difference-with-RQ.md)

|                             | `Daxus` | `React Query` | `Redux With Async Thunk` |
| --------------------------- | :-----: | :-----------: | :----------------------: |
| Customizable data structure |   ✅    |      ❌       |            ✅            |
| Dedupe                      |   ✅    |      ✅       |            ❌            |
| Revalidate on focus         |   ✅    |      ✅       |            ❌            |
| Revalidate on reconnect     |   ✅    |      ✅       |            ❌            |
| Revalidate if stale         |   ✅    |      ✅       |            ❌            |
| Polling                     |   ✅    |      ✅       |            ❌            |
| Error retry                 |   ✅    |      ✅       |            ❌            |
| Invalidate queries          |   ✅    |      ✅       |            ❌            |
| Mutation                    |   ✅    |      ✅       |            ✅            |
| Conditional fetching        |   ✅    |      ✅       |            ❌            |
| DevTool                     |   ❌    |      ✅       |            ✅            |

## Installation

```sh
pnpm add daxus
```

```sh
yarn add daxus
```

```sh
npm install daxus
```

## Simple Example

```typescript
import { createDatabase, createPaginationAdapter, useAccessor } from 'daxus';

export const db = createDatabase();
// You don't have to use createPaginationAdapter specifically.
// You can use any data structure that meets your requirements.
export const postAdapter = createPaginationAdapter<Post>();
export const postModel = db.createModel({
  name: 'post',
  initialState: postAdapter.getInitialState(),
});
export const getPostById = postModel.defineAccessor<Post, number>({
  name: 'getPostById',
  fetchData: async arg => {
    const data = await getPostApi({ id: arg });
    return data;
  },
  syncState: (draft, payload) => {
    postAdapter.upsertOne(draft, payload.data);
  },
});

export function usePost(id: number) {
  const accessor = getPostById(id);
  const { data, error, isFetching } = useAccessor(
    accessor,
    state => {
      return postAdapter.tryReadOne(state, id);
    },
    {
      revalidateOnFocus: true,
    }
  );

  return { data, error, isFetching, revalidate: () => accessor.revalidate() };
}

export const getPostList = postModel.defineInfiniteAccessor<Post[], string>({
  name: 'getPostList',
  fetchData: async filter => {
    return getPostListApi({ filter });
  },
  syncState: (draft, payload) => {
    postAdapter.appendPagination(draft, filter, payload.data);
  },
});

export function usePostList(filter: string) {
  const accessor = getPostList(filter);
  return useAccessor(accessor, postAdapter.tryReadPaginationFactory(filter));
}
```

### Other Examples

- [Simple Forum](https://daxus-simple-forum.vercel.app/)

## Tutorial

In this tutorial, we will build a forum app that contains posts and users' data using Daxus.

Let's start by creating a database using Daxus:

```ts
// in database.ts
import { createDatabase } from 'daxus';

export const database = createDatabase();
```

Next, we'll create a model for posts. In Daxus, a model represents a data type from the backend, and it's essential to create separate models for different data types to avoid mixing different data.

Before creating a model, we need to understand the concept of an "adapter." An adapter is a data access object that provides several operation functions and initial state for the custom data structure defined in the adapter. Daxus currently offers a pagination adapter to handle pagination data.

Let's take a look at how Daxus defines the data structure for pagination data:

```ts
export type Id = string | number;

export interface PaginationMeta {
  ids: Id[];
  noMore: boolean;
}

export interface PaginationState<Data> {
  entityRecord: Record<string, Data>;
  paginationMetaRecord: Record<string, PaginationMeta>;
}
```

The `entityRecord` stores the data instances, with the keys being the IDs of the instances. The `PaginationMeta` stores `ids` to reference the data in the `entityRecord`. We will discuss the reasons behind this design later.

Now, let's create our post model:

```ts
// in postModel.ts
import { createPaginationAdapter } from 'daxus';
import { database } from './database';

export const postAdapter = createPaginationAdapter<Post>();

export const postModel = database.createModel({
  name: 'post',
  initialState: postAdapter.getInitialState(),
});
```

To create a model, we provide a name and the initial state so that the database can internally record it.

Next, we can define an accessor in our model. An accessor is used to fetch remote data and synchronize it with our model. Let's see how to define an accessor:

```ts
// in postAccessor.ts
import { postModel, postAdapter } from './postModel';

export const getPost = postModel.defineAccessor({
  name: 'getPost',
  async fetchData(id: number) {
    return getPostApi({ id });
  },
  syncState(draft, { data }) {
    postAdapter.upsertOne(draft, data);
  },
});
```

An accessor needs a `name` to help the model separate different accessors. The `fetchData` method fetches the remote data, and the `syncState` method synchronizes the fetched data with our model. In this case, we use `postAdapter.upsertOne` to update the post in our model, creating one if it doesn't exist.

To use the accessor in our React app, we can utilize the `useAccessor` hook:

```ts
import { useAccessor } from 'daxus';
import { getPost } from 'postAccessor';
import { postAdapter } from 'postModel';

export function usePost(id: number) {
  return useAccessor(getPost(id), state => postAdapter.tryReadOne(state, id));
  // { data, isFetching, error, accessor }
}
```

The first argument in `useAccessor` is the accessor, which we obtained from the accessor creator defined in _postAccessor.ts_. The second argument is a function that affects the return value of the `data` field. In this example, we use `postAdapter.tryReadOne` to get the post with the specified `id`, and if the post doesn't exist yet, it will return `undefined`.

> We refer to the second argument as `getSnapshot` in Daxus since it obtains a snapshot from the model.

`useAccessor` will only rerender if the return value of `getSnapshot` changes. For example, the following component will not rerender if the `likeCount` of the corresponding post changes:

```tsx
export function PostTitle({ id }: { id: number }) {
  const { data: title } = useAccessor(
    getPost(id),
    state => postAdapter.tryReadOne(state, id)?.title
  );

  return <div>{title}</div>;
}
```

The `PostTitle` component will only rerender if the post's title changes.

When using `useAccessor`, we can place it at any level in our component without worrying about too many requests, as the accessor internally helps deduplicate the requests.

### Pagination Data

Now, let's delve into the data structure of pagination and define how to fetch the post list:

```ts
export interface ListPostOptions {
  forumId?: string;
  filter: 'popular' | 'latest' | 'recommended';
}

export const getPostPaginationKey = ({ forumId = 'all', filter }: ListPostOptions) => {
  return `forumId=${forumId}&filter=${filter}`;
};

export const listPost = postModel.defineInfiniteAccessor({
  name: 'listPost',
  async fetchData(options: ListPostOptions, { pageIndex }) {
    return listPostApi({ ...options, page: pageIndex });
  },
  syncState(draft, { arg, data, pageIndex }) {
    const key = getPostPaginationKey(arg);
    if (pageIndex === 0) {
      postAdapter.replacePagination(draft, key, data);
    } else {
      postAdapter.appendPagination(draft, key, data);
    }
  },
});
```

In this example, we use `forumId` and `filter` to generate a pagination key. Then, we synchronize the state based on the `pageIndex`. If the `pageIndex` is equal to zero, we replace the entire pagination. Otherwise, we append the fetched data to the current pagination.

> The `defineInfiniteAccessor` is almost the same as `defineAccessor`, but it provides `pageIndex` and `previousData` in the `fetchData` and `syncState` methods, allowing us to determine how to fetch the data and how to update the state using them.

Next, let's define a post list component:

```tsx
export function PostList({ options }: { options: ListPostOptions }) {
  const { data } = useAccessor(listPost(options), state =>
    postAdapter.tryReadPagination(state, getPostPaginationKey(options))
  );

  return (
    <div>
      {data?.items.map(post => {
        return <PostEntry key={post.id} post={post} />;
      })}
    </div>
  );
}
```

`PostEntry` is a component that contains information about the post, such as the title and excerpt. Clicking on a `PostEntry` will redirect users to the post detail page, which displays more information about the post, including its full content.

Furthermore, users can update the like count by clicking the like button on the post detail page. Let's see how we achieve this in the `PostDetail` component:

```tsx
export function PostDetail({ id }: { id: number }) {
  const { data } = usePost(id);

  if (!data) return <Loading />;

  const handleLikeButtonClick = async () => {
    postModel.mutate(draft => {
      postAdapter.readOne(draft, id).likeCount += 1;
    });
    try {
      await incrementPostLikeCountApi(id);
    } catch {
      postModel.mutate(draft => {
        postAdapter.readOne(draft, id).likeCount -= 1;
      });
    }
  };

  return (
    <div>
      <div>{data.title}</div>
      <div>{data.content}</div>
      <span>Like count: {data.likeCount}</span>
      <button onClick={handleLikeButtonClick}>Like!</button>
    </div>
  );
}
```

In the `handleLikeButtonClick` function, we first mutate the `postModel` by invoking `postModel.mutate`. This method allows us to directly mutate the model's state. We increment the `likeCount` before calling the API to perform optimistic updating. Then we call `incrementPostLikeCountApi` to update the backend with the result. If it fails, we decrement the `likeCount` to rollback to the original status.

After users click the like button, they may want to return to the post list page to view other posts. To show the latest result, we typically revalidate the post list. That is, we refetch the post list to the page index we have fetched. However, there are two obvious problems:

1. Fetching the entire list just because users liked a post seems wasteful.
2. Users may experience a delay while the post list is being refetched. If a user's network is slow, it may take seconds to see the latest result.

For the first problem, if the request is not expensive, we can just ignore it. But for the second problem, it may cause a terrible user experience. We need to fix it.

To solve the second problem, we can use optimistic updating. However, if we just store the API result for different endpoints, it may cause inconsistency. For example, suppose we have 20 post lists, and all of them contain a post with ID 100. When we update this post, we expect all lists to see the updated result. If we just store the API result for different endpoints, we would need to update every list manually, which is obviously impossible since we may have so many post lists.

This is where the pagination data structure used by Daxus comes to the rescue. Since the pagination data is generated by looking up the `entityRecord`, each data instance references the same entity. Therefore, when we update an entity, all paginations containing this entity will reflect the updated result.

> Currently, Daxus only supports pagination data structure, but you can also build your own data structure to meet your requirements, as Daxus allows for any customized data structure.

### Auto Model

While Daxus allows us to customize the data structure, in many cases, we may not need this level of customization. Often, we simply want to store the fetched data directly without the need for a custom data structure. For instance, user data may not require a custom data structure, and storing the API result directly would be sufficient.

To handle data that doesn't need a custom data structure, Daxus provides a feature called "Auto Model." The auto model is similar to the original model we've seen, but it requires less code to set up. Let's use user data as an example:

```ts
export const userModel = database.createAutoModel({ name: 'user' });

export const getUser = userModel.defineAccessor({
  name: 'getUser',
  async fetchData(userId: string) {
    return getUserApi(userId);
  },
});

export function useUser(id: string) {
  return useAccessor(getUser(id));
}
```

To create an auto model, we use the `createAutoModel` function, which doesn't require us to provide an initial state. Then, we can use `userModel.defineAccessor` to define the accessor. In the auto model's `defineAccessor`, we don't need to specify `syncState` because it handles it internally for us. Moreover, when using `useAccessor` with an auto model, we don't need to provide the `getSnapshot` function. It will directly return the fetched result that is returned in `fetchData`.

For more information about the auto model, you can refer to [this page](./docs/auto-model.md).

### Invalidation

When users click the like button, we expect the corresponding post's `likeCount` to increase by at least one. However, it may not only increment by one because other users might also like the same post concurrently. Therefore, it's a good idea to refetch the data from the backend at this point. To achieve this, we can leverage the accessor we've defined:

```ts
getPost(postId).invalidate();
```

Invoking `invalidate` will trigger a refetch of the data if the accessor is currently being used by at least one `useAccessor` hook. If there are no active `useAccessor` hooks for the accessor, calling `invalidate` will mark the accessor as "stale." When we use a stale accessor in `useAccessor` and set `revalidateIfStale` to `true`, it will automatically trigger a refetch:

```ts
useAccessor(getPost(id), state => postAdapter.tryReadOne(state, id), {
  revalidateIfStale: true,
});
```

Furthermore, if we want to invalidate all post entities, we can directly call `invalidate` on the `getPost` accessor creator:

```ts
getPost.invalidate(); // All accessors generated by this creator will be marked as stale
```

We can also invalidate all accessors related to the post model:

```ts
postModel.invalidate(); // All accessors generated by this model will be marked as stale
```

## Documents

- [The Difference With React Query](./docs/the-difference-with-RQ.md)
- [Accessor](./docs/accessor.md)
- API
  - [`useAccessor`](./docs/API/useAccessor.md)
  - [`useSuspenseAccessor`](./docs/API/useSuspenseAccessor.md)
  - [`useHydrate`](./docs/API/useHydrate.md)
  - [`useModel`](./docs/API/useModel.md)
  - [`ServerStateKeyProvider`](./docs/API/ServerStateKeyProvider.md)
  - [`AccessorOptionsProvider`](./docs/API/AccessorOptionsProvider.md)
- [Pagination](./docs/pagination.md)
- [Conditional Fetching](./docs/conditional-fetching.md)
- [SSR](./docs/ssr.md)
- [Auto Model](./docs/auto-model.md)

## Development Motivation

In my company, we use Redux with async thunk to manage server state. While Redux brings many benefits with centralized state management, it also comes with some drawbacks. For example, combining all reducers into a single store leads to excessively large initial JavaScript files. Additionally, even with Redux Toolkit, we still need to write a lot of repetitive code. As a result, senior engineers in the company have been considering replacing Redux, but so far, we haven't found a suitable package.

### Why not use React Query?

Actually, we have tried incorporating both React Query and SWR into our internal console-type websites, and colleagues find React Query to be more user-friendly than SWR. Although React Query performs well in console-type products, most colleagues believe it is not quite suitable for our main product website.

Our product is a user forum that receives a large number of user visits every day. Here's an example that colleagues think React Query is not suitable for our product: when a user creates a new comment, we want the corresponding post's `totalCommentCount` to increase by one. From the perspective of React Query, we should execute the following code after creating a comment:

```typescript
queryClient.invalidateQueries({ queryKey: ['posts', 'get', postId] });
```

This way, React Query will automatically request the new post in the background and update the corresponding post. However, considering that our post response is quite large, fetching the entire post just for updating `totalCommentCount` seems wasteful. You might think we can do it this way instead:

```typescript
queryClient.setQueryData(['posts', 'get', postId], oldPost => {
  const totalCommentCount = oldPost.totalCommentCount + 1;
  return { ...oldPost, totalCommentCount };
});
```

But there's a problem with this approach. When the user goes back to the post list, the totalCommentCount on the list won't update because the queryKey is different. This may appear odd to observant users. Of course, we can add more code like this:

```typescript
queryClient.setQueryData(['posts', 'list'], oldPosts => {
  const oldPost = oldPosts.find(post => post.id === postId);
  if (!post) return oldPosts;
  const totalCommentCount = oldPost.totalCommentCount + 1;
  const newPost = { ...oldPost, totalCommentCount };
  const oldPostIndex = oldPosts.indexOf(oldPost);
  const newPosts = [...oldPosts];
  newPosts.splice(oldPostIndex, 1, newPost);
  return newPosts;
});
```

This way, we take into account the scenario of updating the list. But is it really that simple? Our list can have various forms, such as "popular," "latest," and different forums with their own lists. The queryKey might look like this:

```typescript
const allPopular = ['posts', 'list', 'popular', 'all'];
const allLatest = ['posts', 'list', 'latest', 'all'];
const forumPopular = ['posts', 'list', 'popular', forumId];
const forumLatest = ['posts', 'list', 'latest', forumId];
```

If we also consider all these scenarios, it might bring us even more mental burden than using Redux, not to mention some API responses have this format:

```json
{
  "items": [],
  "nextKey": "123"
}
```

If we have to mutate the data using the methods mentioned above, it would be a disaster. Moreover, [it goes against the practical way React Query recommends us to use](https://tkdodo.eu/blog/practical-react-query#dont-use-the-querycache-as-a-local-state-manager). While React Query fits well with console-type websites, unfortunately, it seems less suitable for our main website.

> You may think that we can use `queryClient.setQueriesData` to set all lists, but it will make things more complicated. Moreover, the maintainer of RQ doesn't like use this too. (See [here](https://tkdodo.eu/blog/using-web-sockets-with-react-query#partial-data-updates))

So, what makes React Query unsuitable for our main website? I believe it's the level of control over the data. React Query focuses on managing server state for us, which means we don't have as much control over the data compared to using Redux. When using Redux, updating a post would automatically update the corresponding post in the list. However, when using Redux, it's not as straightforward as using `useQuery` to retrieve the data. We need to write a lot of actions and reducers, and if we want to add features like deduplication and revalidation, the amount of code to write increases even more. Clearly, Redux is not the optimal choice.

Since we haven't found a suitable package for our use case, why not develop our own? This brings up the issue of maintainability. If we create a tool that only we use, then the responsibility of maintaining it falls solely on us. Lack of community support is a significant concern for senior colleagues.

As a junior developer, I have always been interested in state management problems. Therefore, I want to try developing my own tool that meets the company's needs as my side project. Of course, I also hope this tool can help other developers who are struggling with managing server state.

### Goals to achieve

First and foremost, it is essential to empower users to have full control over their data. Unlike React Query, where server state management is handled for us, all data writes will be user-defined. Although this may require users to write more code, I believe it is a necessary trade-off, and compared to Redux, the amount of code to write is relatively less.

Another crucial point is to provide a concise and user-friendly hook, similar to `useQuery`, that allows developers to call it from any component without worrying about duplicate requests. Additionally, features like polling and revalidation are also important.

If you have any ideas or suggestions regarding this project, please feel free to share them with me. Thank you.

## Design Philosophy

Using Redux has its advantages, especially when it comes to customizing data structures. In our company, pagination is one of the most frequently used data structures for various entities like posts, comments, and forums. To simplify the process of creating paginations, our senior engineer developed a `createPaginationAdapter` function.

The state type returned by `createPaginationAdapter` is defined as follows:

```typescript
export interface Pagination {
  noMore: boolean;
  index: EntityId[];
  loading: boolean;
  fetched: boolean;
  error?: any;
}

export interface PaginationState<T> {
  data: Record<EntityId, T | undefined>;
  paginations: Record<string, Pagination | undefined>;
}
```

`PaginationState` consists of two properties: `data` and `paginations`. `data` stores all the entity data, while `paginations` keeps track of the pagination states and the associated IDs.

To illustrate, let's consider the example of managing posts. When retrieving the list of posts without any filters, the API endpoint would look like `/api/posts?filter=all`, and the corresponding pagination key would be `filter=all`. Suppose the API returns the first page of posts with IDs 1 to 5. In this case, `paginations["filter=all"]` would contain the following:

```javascript
{
    noMore: false,
    index: [1, 2, 3, 4, 5],
    loading: false,
    fetched: true
}
```

The `data` object would store the actual post data:

```javascript
{
    1: {
        // post data
    },
    // and so on
}
```

To access the pagination for `filter=all`, we can use the object obtained from `createPaginationAdapter`:

```javascript
const postAdapter = createPaginationAdapter();

function usePost() {
  const postPagination = useSelector(state =>
    postAdapter.selectByPagination(state.post, 'filter=all')
  );
  return postPagination;
}
```

At this point, you might think, "Isn't this similar to RTK's [`createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter)?" Indeed, there are similarities between the two, but `createPaginationAdapter` is an enhanced version specifically designed for pagination data. Now, let's delve into its most significant advantage.

Do you remember [when React Query fails to meet our needs](#why-not-use-swr-or-react-query)? Yes, it's when we have multiple paginations that might include the same post. React Query cannot handle this scenario effectively, but the pagination adapter perfectly solves this problem. By centralizing all the data in `data` and using `paginations` to collect the associated IDs, any updates to a specific post will automatically reflect in all the paginations containing that post. There won't be any inconsistencies.

So, what is the design philosophy behind Daxus?

The answer lies in **customized data structures**.

Every application has unique requirements for data structures. In our company, we designed `PaginationState` to fulfill our needs. Daxus's design philosophy empowers developers to define and use data structures tailored to their specific requirements. You only need to invest effort in creating suitable adapters and instructing Daxus on how to fetch data and synchronize it with your model. Daxus takes care of the rest, including deduplication, revalidation, and more.

However, creating an adapter does require some code, so Daxus also strives to provide pre-built adapters that cater to most use cases. If you have any new data structures in mind that Daxus doesn't support yet, we welcome your suggestions, and we'll make an effort to implement them.

> Currently, Daxus only offers `createPaginationAdapter`, and I haven't thought of other forms of data structures. If you have any ideas, please let me know!

<!-- images -->

[npm-image]: https://badge.fury.io/js/daxus.svg
[license-image]: https://img.shields.io/github/license/jason89521/daxus?style=flat-square
[pr-welcoming-image]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[codecov-image]: https://codecov.io/gh/jason89521/daxus/branch/main/graph/badge.svg

<!-- link -->

[npm-url]: https://www.npmjs.com/package/daxus
[license-url]: https://github.com/jason89521/daxus
[pr-welcoming-url]: https://github.com/jason89521/daxus/pull/new
[codecov-url]: https://codecov.io/github/jason89521/daxus?branch=main
