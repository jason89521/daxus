# React Server Model (WIP)

Manage the server state and let user define the shape of the data from the server.

- [x] Cache the data from the server
- [x] Dedupe the request from the same action and argument
- [x] Revalidate when it mount and there is stale data
- [x] Revalidate on focus
- [ ] Revalidate when reconnect
- [ ] Refresh within an interval
- [ ] Error handling
- [ ] Mutation
- [ ] Infinite fetch
  - [ ] Revalidation
  - [ ] Error handling
- [x] Pagination Adapter
- [ ] Testing

## API

Create a model

```ts
import type { Action } from 'tbd';
import { Model, createPaginationAdapter } from 'tbd';

export const postAdapter = createPaginationAdapter<Post>({});
const initialModel = postAdapter.initialModel;

type PostModel = typeof initialModel;

const getPostById: Action<PostModel, number, Post> = {
  type: 'normal',
  fetchData: async id => {
    const data = await getPostByIdRequest(id);
    return data;
  },
  syncModel: (draft, { remoteData }) => {
    postAdapter.upsertOne(draft, remoteData);
  },
};

const getPostList: Action<PostModel, { layout: PostLayout }, Post[]> = {
  type: 'infinite',
  fetchData: async ({ layout }, { pageIndex }) => {
    const data = await getPostListRequest({ layout, page: pageIndex });
    return data;
  },
  syncModel: (draft, { remoteData, arg, pageIndex }) => {
    const paginationKey = JSON.stringify(arg);
    postAdapter.updatePagination(draft, { dataArray: remoteData, paginationKey, pageIndex });
  },
};

export const postModel = new Model(initialModel, { getPostById, getPostList });
```

Use the model with `useFetch` or `useInfiniteFetch`

```jsx
export function PostList() {
  const { data, fetchNextPage } = useInfiniteFetch(
    postModel.accessorGetters.getPostList({ layout }),
    model => {
      const key = JSON.stringify({ layout });
      return postAdapter.getPagination(model, key);
    }
  );

  return (
    <div>
      {data.map(post => {
        return (
          <div key={post.id}>
            <div>title: {post.title}</div>
          </div>
        );
      })}
      }
    </div>
  );
}

export function Post({ id }) {
  const { data } = useFetch(
    postModel.accessorGetters.getPostById(id),
    model => {
      return model.data[id];
    },
    { revalidateOnFocus: false }
  );

  return <div>title: {data.title}</div>;
}
```
