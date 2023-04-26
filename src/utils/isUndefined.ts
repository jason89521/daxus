export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}
