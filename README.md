# React Server Model

RSM (React Server Model) is a server state management library that emphasizes developer control over data. It allows for customized data structures and adapters to handle data updates effectively. With an intuitive API, developers can directly access and manipulate their data structures. RSM also provides hooks like `useFetch` and `useInfiniteFetch` for easy server data retrieval and synchronization. It offers a flexible approach for developers who desire more control and customization in managing server state in their React applications.

## TOC

- [Getting Started](#getting-started)
- [Concept](#concept)
- [Why Not Just Using SWR](#why-not-just-using-swr)
- [The Motivation](#the-motivation)

## Getting Started

In React Server Model, you need to define the shape of your data yourself. We take care of handling deduplication, revalidation, and other data fetching optimizations. However, it is up to you to decide how to update your data after fetching it.

### Model

We refer to different data shapes as a "model." In my company, we have data such as posts, comments, and forums. Defining the structure of these different data shapes, such as pagination, can be considered a model.

```typescript
import { createPaginationAdapter, createModel } from 'react-server-model';

const postAdapter = createPaginationAdapter({});
const postModel = createModel(postAdapter.initialModel);
```

Defining a model is straightforward. You simply use `createModel` and pass in the initial value.

> `createPaginationAdapter` is a utility function provided by us to quickly create a pagination model. However, you can also define your custom pagination model.

### Action

Once you have created a model, you can start defining actions.

```typescript
const getPostById = postModel.defineAction<number, Post>('normal', {
  fetchData: async id => {
    const data = await getPostFromServer(id);
    return data; // the type of data is `Post`
  },
  syncModel: (model, { data, arg }) => {
    postAdapter.upsertOne(model, data);
  },
});

const getPostList = postModel.defineAction<{ filter: string }, Post[]>('infinite', {
  fetchData: async ({ layout }, { pageIndex, previousData }) => {
    // If the previous API returns an empty array, stop fetching.
    if (previousData?.length === 0) return null;
    const data = await getPostListFromServer({ filter, page: pageIndex });
    return data;
  },
  syncModel: (model, { data, arg, pageIndex }) => {
    // arg -> {filter}
    // You can use any function to generate the pagination key.
    // We use `JSON.stringify` for simplicity here.
    const paginationKey = JSON.stringify(arg);
    if (pageIndex === 0) {
      postAdapter.replacePagination(model, paginationKey, data);
    } else {
      postAdapter.appendPagination(model, paginationKey, data);
    }
  },
});
```

When defining an action, you need to provide two necessary parameters: `fetchData` and `syncModel`. `fetchData` describes how this action fetches data from the server, and `syncModel` determines how the data is synchronized into your model after fetching.

You may have noticed that the first parameter of `defineAction` has two possible values. When implementing infinite scrolling, using `'infinite'` is a better choice. Otherwise, for most cases, `'normal'` should suffice.

### `useFetch` and `useInfiniteFetch`

After defining actions, you can use `useFetch` or `useInfiniteFetch` in a custom hook to fetch data from the server. Use `useFetch` for `'normal'` actions and `useInfiniteFetch` for `'infinite'` actions.

```typescript
import { useFetch, useInfiniteFetch } from 'react-server-model';

export function usePost(id: number) {
  const result = useFetch(getPostById(id), model => {
    return postAdapter.readOne(model, id);
  });
  return result; // {data, error, isFetching}
}

export function usePostList(filter: string) {
  const result = useInfiniteFetch(
    getPostList({ filter }),

    model => {
      const key = JSON.stringify({ filter });
      return postAdapter.readPagination(model, key);
    }
  );
  return result; // { data, error, isFetching, fetchNextPage}
}
```

The first parameter of `useFetch` and `useInfiniteFetch` is the return value of the previously defined action. The second parameter determines how to display the corresponding model data. These hooks will automatically handle the request initiation and data synchronization into your model, as defined in the actions.

You can use these custom hooks anywhere in your code, and you don't need to worry about duplicate requests because we handle that for you.

### Mutation

Finally, let's discuss model mutation. In many cases, besides fetching data from the server, we also have user interactions that update data. For example, if a user creates a new post and we want to display it in the list with the filter set to "all," we can use the `mutate` method:

```typescript
export function createPost(title: string, content: string) {
  const res = await createPostApi({ title, content });
  postModel.mutate(model => {
    postAdapter.appendPagination(model, 'all', [res]);
  });
}
```

That's it! Using `mutate`, you can directly update your model. Subsequently, the `useFetch` and `useInfiniteFetch` hooks of the corresponding actions will check if the data you want to display has changed and trigger a rerender if necessary.

## Concept

The greatest advantage of using RSM is that you can customize the data structure for each data. For example, pagination might be the most suitable data structure for comments, while a dictionary might be preferred based on user settings. It depends on how you intend to use the data.

The core concept of RSM is to create an adapter for your data structure to handle various data updates (similar to the provided `createPaginationAdapter`). All operations that modify the data are performed through the adapter, making the code more concise and reducing code duplication.

RSM provides an intuitive API that allows direct access to your data structure, and you can expect all data to be updated according to your adapter. This is particularly useful when your data has high dependencies. For example, when you add a comment to post 1, you would expect the `totalCommentCount` of post 1 to increase. In this case, you can simply write:

```javascript
async function createComment(postId, content) {
  const response = await createCommentApi(postId, content);
  // handle other logic with the response
  postModel.mutate(model => {
    const post = postAdapter.readOne(model, postId);
    if (post) post.totalCommentCount += 1;
  });
}
```

As you can see, updating the state using `postModel` and `postAdapter` is straightforward, and you can integrate this code into any function, not just hooks or components.

In addition, RSM provides two hooks, `useFetch` and `useInfiniteFetch`, which help you fetch server data and synchronize it with your data structure. Using these hooks eliminates the need to worry about deduplication, revalidation, and other concerns, as RSM takes care of them. Of course, if you prefer, you can also use `useEffect` to fetch data. It depends on how you want to use RSM.

The main goal of RSM is to give you a high level of control over your data, while deduplication, revalidation, and similar features are secondary. If you don't require such a high level of control over your data, React Query or SWR might be more suitable choices.

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
