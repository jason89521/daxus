export class FetchAbortedError extends Error {
  constructor(isInfinite: boolean, options?: ErrorOptions) {
    super(`Is infinite accessor: ${isInfinite}`, options);
  }
}
