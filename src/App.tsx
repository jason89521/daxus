import { useState } from 'react';
import { Post } from './components';

import { postModel } from './model';
import { updatePostLayoutById } from './request';

const { getPostById } = postModel.accessorGetters;

function UpdateButton({ id }: { id: number }) {
  const handleClick = () => {
    getPostById(id).mutate(async state => {
      if (state.index[id]) {
        const layout = state.index[id]?.layout === 'classic' ? 'image' : 'classic';
        const updatedPost = await updatePostLayoutById(id, layout);
        state.index[id] = { ...updatedPost };
      }
    });
  };

  return <button onClick={handleClick}>Update post{id}</button>;
}

function App() {
  const [postId, setPostId] = useState(1);

  const changePostId = () => {
    if (postId === 3) setPostId(1);
    else setPostId(postId + 1);
  };

  return (
    <div>
      <button onClick={changePostId}>Change post id</button>
      <UpdateButton id={postId} />
      <Post id={postId} />
      <Post id={postId} />
    </div>
  );
}

export default App;
