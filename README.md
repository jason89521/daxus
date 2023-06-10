# React Server Model

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![PR's Welcome][pr-welcoming-image]][pr-welcoming-url]

RSM (React Server Model) is a server state management library that emphasizes developer control over data. It allows for customized data structures and adapters to handle data updates effectively. With an intuitive API, developers can directly access and manipulate their data structures. RSM also provides hooks for easy server data retrieval and synchronization. It offers a flexible approach for developers who desire more control and customization in managing server state in their React applications.

- [React Server Model](#react-server-model)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
    - [Usage](#usage)
  - [Development Motivation](#development-motivation)
    - [Why not use SWR or React Query?](#why-not-use-swr-or-react-query)
    - [Goals to achieve](#goals-to-achieve)

## Getting Started

### Installation

```sh
pnpm add react-server-model
```

### Usage

In RSM (React Server Model), you need to create a separate model with different type of data structure for each data. For example, you can create a pagination model for posts and a dictionary model for user settings. Let's take posts as an example.

First, create the post model:

```typescript
export const postAdapter = createPaginationAdapter({});
export const postModel = createModel(postAdapter.initialModel);
```

RSM provides the `createPaginationAdapter` function to quickly create a pagination model. This function returns an object that includes the initial model and various pagination operations.

After creating the model, you need to define different accessors. Accessors play a crucial role in fetching server data and synchronizing it with the model.

```typescript
export const getPostById = postModel.defineAccessor<number, Post>('normal', {
  fetchData: async arg => {
    const data = await getPostApi({ id: arg });
    return data;
  },
  syncModel: (model, payload) => {
    postAdapter.upsertOne(model, payload.data);
  },
});

export const getPostList = postModel.defineAccessor<void, { items: Post[]; nextKey: string }>(
  'infinite',
  {
    fetchData: async (_arg, { pageIndex, previousData }) => {
      if (previousData?.items.length === 0) return null; // there is no more data to fetch
      const data = await getPostListApi({ pageIndex, nextKey: previousData?.nextKey });
      return data;
    },
    syncModel: (model, payload) => {
      const paginationKey = 'all';
      postAdapter.appendPagination(model, paginationKey, payload.data.items);
      if (payload.data.items.length === 0) {
        postAdapter.setNoMore(model, paginationKey, true);
      }
    },
  }
);
```

We use `defineAccessor` to define an accessor. First, we determine whether the accessor is `'normal'` or `'infinite'`. `'infinite'` accessors are typically used for implementing infinite scrolling, while `'normal'` accessors are sufficient for most cases. Next, we define `fetchData` and `syncModel`. `fetchData` is the function used by the accessor to handle requests, and `syncModel` synchronizes the data obtained from `fetchData` with the model. It's where you decide how to update the model with the data.

`defineAccessor` returns an accessor creator function. Apart from using `useAccessor` (which we'll discuss later), you can also directly utilize the accessor to revalidate data:

```typescript
const accessor = getPostById(0);
accessor.revalidate();
```

For `'infinite'` accessors, there is an additional `fetchNext` function to fetch the next page of pagination:

```typescript
const accessor = getPostList();
accessor.fetchNext();
```

RSM provides the `useAccessor` hook, which automatically calls `revalidate`. You can also enable or disable various settings for the accessor within this hook, such as `revalidateOnFocus` and `pollingInterval`.

```typescript
export function usePost(id: number, revalidateOnFocus: boolean) {
  const accessor = getPostById(id);
  const { data, error, isFetching } = useAccessor(
    accessor,
    model => postAdapter.tryReadOne(model, id),
    {
      revalidateOnFocus,
    }
  );
  const isLoading = typeof data === 'undefined' && isFetching;

  return { data, error, isLoading, revalidate: () => accessor.revalidate() };
}
```

The first argument of `useAccessor` is the accessor, and the second argument determines how to read the corresponding data from the model. In the above example, `postAdapter.tryReadOne` reads the data for the corresponding ID from the model and returns `undefined` if the data hasn't been obtained yet. The last argument is for setting the accessor's options.

You can safely call `useAccessor` for the same accessor in multiple places without triggering multiple requests because the accessor handles deduplication internally.

Finally, let's discuss model mutation. Let's assume we need to create a comment, and after successfully creating it, we want to increment the `totalCommentCount` of the corresponding post:

```typescript
async function createComment(postId: number, content: string) {
  const newComment = await createCommentApi({ postId, content });
  // other logic with `newComment`
  postModel.mutate(model => {
    postAdapter.readOne(model, postId).totalCommentCount += 1;
  });
}
```

Mutating the model is straightforward, and thanks to RSM's use of Immer, you can mutate the model without worrying about immutability. Feel free to mutate it directly.

## Development Motivation

In my company, we use Redux with async thunk to manage server state. While Redux brings many benefits with centralized state management, it also comes with some drawbacks. For example, combining all reducers into a single store leads to excessively large initial JavaScript files. Additionally, even with Redux Toolkit, we still need to write a lot of repetitive code. As a result, senior engineers in the company have been considering replacing Redux, but so far, we haven't found a suitable package.

### Why not use SWR or React Query?

Actually, we have tried incorporating both SWR and React Query into our internal console-type websites, and colleagues find React Query to be more user-friendly than SWR. Although React Query performs well in console-type products, most colleagues believe it is not quite suitable for our main product website.

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
const allLatest = [('posts', 'list', 'latest', 'all')];
const forumPopular = [('posts', 'list', 'popular', forumId)];
const forumLatest = [('posts', 'list', 'latest', forumId)];
```

If we also consider all these scenarios, it might bring us even more mental burden than using Redux, not to mention some API responses have this format:

```json
{
  "items": [],
  "nextKey": "123"
}
```

If we have to mutate the data using the methods mentioned above, it would be a disaster. Moreover, [it goes against the practical way React Query recommends us to use](https://tkdodo.eu/blog/practical-react-query#dont-use-the-querycache-as-a-local-state-manager). While React Query fits well with console-type websites, unfortunately, it seems less suitable for our main website.

So, what makes React Query unsuitable for our main website? I believe it's the level of control over the data. React Query focuses on managing server state for us, which means we don't have as much control over the data compared to using Redux. When using Redux, updating a post would automatically update the corresponding post in the list. However, when using Redux, it's not as straightforward as using `useQuery` to retrieve the data. We need to write a lot of actions and reducers, and if we want to add features like deduplication and revalidation, the amount of code to write increases even more. Clearly, Redux is not the optimal choice.

Since we haven't found a suitable package for our use case, why not develop our own? This brings up the issue of maintainability. If we create a tool that only we use, then the responsibility of maintaining it falls solely on us. Lack of community support is a significant concern for senior colleagues.

As a junior developer, I have always been interested in state management problems. Therefore, I want to try developing my own tool that meets the company's needs as my side project. Of course, I also hope this tool can help other developers who are struggling with managing server state.

### Goals to achieve

First and foremost, it is essential to empower users to have full control over their data. Unlike React Query, where server state management is handled for us, all data writes will be user-defined. Although this may require users to write more code, I believe it is a necessary trade-off, and compared to Redux, the amount of code to write is relatively less.

Another crucial point is to provide a concise and user-friendly hook, similar to `useQuery`, that allows developers to call it from any component without worrying about duplicate requests. Additionally, features like polling and revalidation are also important.

If you have any ideas or suggestions regarding this project, please feel free to share them with me. Thank you.

[npm-image]: https://badge.fury.io/js/react-server-model.svg
[npm-url]: https://www.npmjs.com/package/react-server-model
[license-image]: https://img.shields.io/github/license/jason89521/react-server-model?style=flat-square
[license-url]: https://github.com/jason89521/react-server-model
[pr-welcoming-image]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[pr-welcoming-url]: https://github.com/jason89521/react-server-model/pull/new
