export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export const baseUrl = getBaseUrl();

export function getPostIndex(postId: string) {
  return Number(postId.slice(7));
}
