# React Server Model

The goal of React Server Model is to provide an API that is as convenient to use as SWR, while also allowing customization of data, enabling users to have more flexibility in modifying their data.

## Document

- [Getting Started](/docs/getting-started.md)
- [API](/docs/api.md)

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
      commentAdapter.appendPagination(state, key, [action.payload]);
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
