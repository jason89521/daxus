# The Difference with React Query

## TL;DR

If your app doesn't require managing a single source of truth for state, then React Query is more suitable. Otherwise, Daxus is a better choice.

## The Power of React Query

React Query automatically manages the server state for you, so you don't have to worry about it. You simply provide a query key and a function to fetch the data. React Query treats the data from the server as the single source of truth. When performing server-side operations (e.g., PUT, CREATE, DELETE), React Query encourages you to directly invalidate the data using the corresponding query key. React Query then automatically revalidates the data in the background (if the data is active).

If you don't need to manage the state yourself, React Query is a good option.

## The Power of Daxus

Unlike React Query, Daxus requires you to manage the state yourself. You need to define how the server data should be synced with your state. This can be useful when you want to minimize API requests. For example, let's say we have two lists of posts: "latest" and "popular." Both lists include a post with the ID "100." If a user updates this post, we want the user to see the updated result in both lists without revalidating the entire lists separately.

This is where Daxus comes in. It allows developers to build their own data structures, enabling data normalization.

## Conclusion

If you want full control over your data and the ability to customize the data structure, Daxus is the right choice. However, if you prefer automatic server state management and quick development for lightweight applications, React Query is a suitable option.

The choice depends on your project requirements and personal preferences.
