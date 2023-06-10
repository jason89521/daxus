# React Server Model

RSM (React Server Model) is a server state management library that emphasizes developer control over data. It allows for customized data structures and adapters to handle data updates effectively. With an intuitive API, developers can directly access and manipulate their data structures. RSM also provides hooks like `useFetch` and `useInfiniteFetch` for easy server data retrieval and synchronization. It offers a flexible approach for developers who desire more control and customization in managing server state in their React applications.

- [React Server Model](#react-server-model)
  - [Getting Started](#getting-started)
  - [Why not just using SWR](#why-not-just-using-swr)
  - [The Motivation](#the-motivation)
    - [Modifying Data](#modifying-data)
    - [Retrieving Data](#retrieving-data)
    - [Conclusion](#conclusion)
  - [The features I need to achieve](#the-features-i-need-to-achieve)

## Getting Started

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

## Why not just using SWR

The core idea of SWR is to keep the server state as up-to-date as possible. However, in our company with a large user base, we prefer to make requests only when necessary.

Consider a scenario is when a user adds a comment. We want to either 1. place the comment at the top of the comment list if the user chooses to view the most popular comments or 2. place it at the bottom of the comment list if the user chooses to view comments from oldest to newest. In this situation, we don't want to revalidate the entire comment list because the API's response may not include the user's comment (especially when the user is viewing the most popular comments, the newly added comment is unlikely to become popular).

However, we also have use cases where we need the latest data, such as notifications. Although SWR is a great choice in this scenario, it doesn't meet the requirements mentioned earlier. To maintain consistency in our tech stack, we want to avoid using different libraries in different situations. For example, using SWR for fetching notifications but using another library for the article list.

And that's why I developed this library. Unlike the core idea of SWR, my goal is not to keep the server state as up-to-date as possible, but to provide developers with more control over when to update the data.

## The Motivation

I use Redux for state management in my work. One of the advantages of Redux is that it centralizes all the states, and we can use actions to update them. For example, when a user creates a comment, we expect the `post.totalCommentCount` to increase.

However, this convenience comes with some drawbacks, with the biggest one being code splitting. Since Redux centralizes all the code in the store, it results in a large initial JavaScript bundle size.

Some of my colleagues have tried incorporating SWR into our internal systems to manage server state. While SWR requires much less code compared to Redux, some team members find it less user-friendly because we are accustomed to mutating the required state in Redux (especially when using `useSWRInfinite`).

Below is a comparison of Redux and SWR from my perspective in terms of their advantages and disadvantages.

### Modifying Data

Let's take adding a comment as an example. When we add a comment, we want the corresponding post's `totalCommentCount` to increase by 1. In Redux, we would write it like this:

```javascript
// in comment/action.ts
export const createComment = createAsyncThunk(
    'comment/create',
    async (ctx, payload) => {
        return api.post('/api/createComment')
    }
)

// in post/slice.ts
export const postSlice = createSlice({
    name: 'post',
    // some configuration
    extraReducers: builder => {
        builder.addCase(createComment.fulfilled, (state, action) => {
            state.data[action.payload.postId].totalCommentCount += 1;
        })
    }
})

// in an arbitrary component
function Component() {
    const dispatch = useDispatch();

    const handleCreateComment = () => {
        dispatch(createComment("comment"))
    }

    return (
        //
    )
}
```

For SWR, the code would look like this:

```javascript
export async function createComment() {
  const newComment = await api.post('/api/createComment');
  mutate(`/api/posts/${newComment.postId}`, post => {
    if (post) {
      return { ...post, totalCommentCount: post.totalCommentCount + 1 };
    }
  });
}
```

It seems that the code in SWR is much more concise. Now let's extend this example further. After adding a comment, we also want to add that comment to the list of comments. The API response format for fetching the comment list is as follows:

```json
{
  "items": [],
  "nextKey": "123"
}
```

If we were to write it in Redux, we would need to add some additional code to the comment slice:

```javascript
export const commentSlice = createSlice({
  name: 'comment',
  // some configuration
  extraReducers: builder => {
    // other reducers
    builder.addCase(createComment.fulfilled, (state, action) => {
      const key = getKey(action.meta.arg);
      commentAdapter.appendPagination(state, key, [action.payload.items]);
      commentAdapter.setNextKey(state, key, action.payload.nextKey);
    });
  },
});
```

> Here, `commentAdapter` is created by an utility function `createPaginationAdapter` implemented by my company, which facilitates state updates. It is not imported from RTK.

However, if we were using SWR:

```javascript
export async function createComment() {
  // --- snip ---
  mutate(unstable_serialize(getCommentPageKey()), resArray => {
    if (!resArray) return;
    const last = resArray.at(-1);
    if (!last) return;
    const newItems = [...last.items, newComment];
    const newArray = [...resArray.slice(0, -1), { items: newItems, nextKey: last.nextKey }];

    return newArray;
  });
}
```

Compared to SWR, I believe the Redux approach is more intuitive. However, this advantage is also due to the use of the `createPaginationAdapter` utility function.

### Retrieving Data

Continuing with the example of the comment list, in SWR we would write it like this:

```javascript
export function useCommentList() {
  const { data, setSize } = useSWRInfinite((pageIndex, previousData) => {
    if (previousData && !previousData.nextKey) return null;
    const nextKey = previouseData.nextKey;

    return appendUrlParams('/api/commentList', { nextKey, pageIndex });
  });

  const commentList = useMemo(() => {
    if (!data) return;

    [];

    return data.map(({ items }) => items).flat();
  }, [data]);

  const fetchNextPage = useCallback(() => {
    return setSize(prev => prev + 1);
  }, [setSize]);

  return { commentList, fetchNextPage };
}
```

In Redux, we would write it like this:

```javascript
export function useCommentList() {
  const dispatch = useDispatch();
  const commentList = useSelector(state => selectCommentList(state));

  useEffect(() => {
    dispatch(getCommentList({ next: false }));
  }, [dispatch]);

  const fetchNextPage = useCallback(() => {
    dispatch(getCommentList({ next: true }));
  }, [dispatch]);

  return { commentList, fetchNextPage };
}
```

Although the two approaches return the same result, the user experience is quite different. Since SWR automatically fetches the data, we don't need to use `useEffect` to fetch the data like we do in Redux. However, due to the specific format of the API response, we need to handle the `data` returned by `useSWR` separately.

Additionally, SWR also handles deduplication and revalidation automatically, which Redux does not provide out of the box. If we want to implement these functionalities in Redux, we would need to write more code.

However, Redux also has other advantages. The main advantage in data retrieval is centralized data management. Taking the post list as an example, suppose we fetch a post list (IDs 1 to 10) from the API. When a user wants to click and view post with ID 1, we can directly retrieve the data from the store. If we want to ensure the data is up-to-date, we can quietly fetch the data in the background. However, with SWR, since the cache is recorded by key, when a user clicks to navigate to another page, they will see a loading screen first and then the post content when the data returns.

### Conclusion

To summarize the advantages and disadvantages of Redux:

Advantages: Centralized data management, customization of data shape, intuitive data mutation.

Disadvantages: Requires writing a lot of additional code, all code is centralized in the store, difficult code splitting.

Now let's look at SWR:

Advantages: Automatic deduplication and revalidation.

Disadvantages: Data is not centrally managed, inability to customize returned data.

Based on the above, my motivation for developing React Server Model is to create a package that combines the advantages of both Redux and SWR while minimizing their disadvantages.

## The features I need to achieve

- Automatic deduplication and revalidation
- Customization of data shape
- Easier and more intuitive data mutation
- Ability to achieve code splitting
