# The Difference with React Query

## TL;DR

If your app doesn't need to implement a single source of truth, React Query may be more suitable for you. Otherwise, Daxus is a better choice.

## The Power of React Query

React Query manages the server state for you, eliminating the need to worry about it. All you need to do is provide a query key and a function to fetch the data. The single source of truth in React Query is the data from the server. When you perform a side effect on the server (e.g., PUT/CREATE/DELETE methods), React Query encourages you to directly invalidate the data with the corresponding query key. React Query will then automatically revalidate the data in the background if the data is active.

As a result, if you don't need to manage the state yourself, React Query is a good fit.

## The Power of Daxus

In contrast to React Query, Daxus requires you to manage the state yourself. You need to tell Daxus how you want to sync the server data with your state. This can be useful when you want to minimize API requests. For example, let's say we have two post lists: the "latest" list and the "popular" list. Both lists contain a post with the ID "100". If a user updates this post, we expect them to see the updated result in both lists. However, we don't want to revalidate these lists separately as it would be wasteful.

This is where Daxus comes to the rescue. It allows developers to build their own data structures, enabling data normalization.

## Conclusion

If you want full control over your data, Daxus is the solution for you. Otherwise, using React Query alone is sufficient.
