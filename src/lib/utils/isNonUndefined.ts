import { isUndefined } from './isUndefined.js';
import type { NonUndefined } from './types.js';

export function isNonUndefined<T>(value: T): value is NonUndefined<T> {
  return !isUndefined(value);
}
