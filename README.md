# React Server Model

React Server Model is a data management library designed for front-end application development. It provides a consistent and efficient solution for organizing and synchronizing data in front-end applications, making it easier for developers to handle data fetching, management, and synchronization.

In React Server Model, the core concept is the Model. A Model is a unit used to organize and manage data. Developers can create multiple Models based on the requirements of their application, each containing multiple data models such as Post, Comment, and more.

Developers can use the provided Adapters to handle data normalization for individual Models, ensuring consistency among different data within a Model. Additionally, developers have the flexibility to define the shape of a Model to accommodate specific application needs.

## Document

- [Getting Started](/docs/getting-started.md)
- [API](/docs/api.md)

## Why Create This Project

I use Redux for state management in my work. One of the advantages of Redux is that it centralizes all the states, and we can use actions to update them. For example, when a user creates a comment, we expect the `post.totalCommentCount` to increase.

However, this convenience comes with some drawbacks, with the biggest one being code splitting. Since Redux centralizes all the code in the store, it results in a large initial JavaScript bundle size.

Some of my colleagues have tried incorporating SWR into our internal systems to manage server state. While SWR requires much less code compared to Redux, some team members find it less user-friendly because we are accustomed to mutating the required state in Redux (especially when using `useSWRInfinite`).

Based on these reasons, I want to attempt developing a library that meets our work requirements.
