export const baseUrl = 'http://localhost:3000';

export function getPostIndex(postId: string) {
  return Number(postId.slice(7));
}
