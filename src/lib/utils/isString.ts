export function isString(s: unknown): s is string {
  return typeof s === 'string';
}
