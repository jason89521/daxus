import { stableHash } from './stableHash.js';

export function getKey(prefix: number, arg: unknown) {
  return `${prefix}/${stableHash(arg)}`;
}
