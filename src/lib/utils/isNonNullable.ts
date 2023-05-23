import { isUndefined } from './isUndefined';

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && !isUndefined(value);
}
