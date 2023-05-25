export function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export async function waitFor<T>(fn: () => Promise<T>, time: number): Promise<T> {
  await sleep(time);
  const result = await fn();

  return result;
}
