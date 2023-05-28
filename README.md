# React Server Model

The goal of React Server Model is to provide an API that is as convenient to use as SWR, while also allowing customization of data, enabling users to have more flexibility in modifying their data.

## Document

- [Getting Started](/docs/getting-started.md)
- [API](/docs/api.md)

## Why Create This Project

I use Redux for state management in my work. One of the advantages of Redux is that it centralizes all the states, and we can use actions to update them. For example, when a user creates a comment, we expect the `post.totalCommentCount` to increase.

However, this convenience comes with some drawbacks, with the biggest one being code splitting. Since Redux centralizes all the code in the store, it results in a large initial JavaScript bundle size.

Some of my colleagues have tried incorporating SWR into our internal systems to manage server state. While SWR requires much less code compared to Redux, some team members find it less user-friendly because we are accustomed to mutating the required state in Redux (especially when using `useSWRInfinite`).

Based on these reasons, I want to attempt developing a library that meets our work requirements.
