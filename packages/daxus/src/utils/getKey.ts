import { stableHash } from './stableHash.js';

export function getKey(creatorName: string, arg: unknown) {
  return `${creatorName}/${stableHash(arg)}`;
}
