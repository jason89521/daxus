import { useState } from 'react';
import { Post, PostList } from './components';

import { postAdapter, postModel, getPostById } from './model';
import { usePost } from './hooks';
import { updatePostLayoutById } from './request';

function UpdateButton({ id }: { id: number }) {
  const { post } = usePost({ id });

  const handleClick = async () => {
    if (!post) return;
    const newLayout = post.layout === 'image' ? 'classic' : 'image';
    const data = await updatePostLayoutById(id, newLayout);
    postModel.mutate(draft => {
      postAdapter.upsertOne(draft, data);
    });
  };

  return (
    <button onClick={handleClick}>
      {post ? `Update post${id}` : `post ${1} haven't been fetch`}
    </button>
  );
}

function App() {
  const [postId, setPostId] = useState(1);
  const [show, setShow] = useState(true);

  const changePostId = () => {
    if (postId === 3) setPostId(1);
    else setPostId(postId + 1);
  };

  const revalidate = () => {
    getPostById(postId).revalidate();
  };

  return (
    <div>
      <button onClick={changePostId}>Change post id</button>
      {/* <UpdateButton id={postId} /> */}
      <button onClick={() => setShow(!show)}>hide / show first post</button>
      <button onClick={revalidate}>revalidate current post</button>
      {show && <Post revalidateOnFocus={false} id={postId} />}
      <Post id={postId} pollingInterval={0} />
      <PostList />
    </div>
  );
}

export default App;
