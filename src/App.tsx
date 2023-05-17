import { useState } from 'react';
import { Post, PostList } from './components';

function UpdateButton({ id }: { id: number }) {
  const handleClick = () => {
    // Todo
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
      <PostList />
    </div>
  );
}

export default App;
