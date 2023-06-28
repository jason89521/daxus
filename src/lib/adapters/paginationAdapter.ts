import { isNumber, isString } from '../utils';
import { isNonNullable } from '../utils/isNonNullable';

type Id = string | number;

interface PaginationMeta {
  /** Store the ids for each page index. */
  ids: Id[];
  noMore: boolean;
}

interface Pagination<Data> {
  items: Data[];
  noMore: boolean;
}

interface PaginationState<Data> {
  entityRecord: Record<string, Data | undefined>;
  paginationMetaRecord: Record<string, PaginationMeta | undefined>;
}

function defaultGetId(data: unknown): Id {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    const id = data?.id;
    if (!isString(id) && !isNumber(id)) throw new Error('The id should be a string or a number.');

    return id;
  }

  throw new Error('Should specify the `getId` function');
}

function createPaginationMeta(): PaginationMeta {
  return {
    ids: [],
    noMore: false,
  };
}

export function createPaginationAdapter<Data, RawData = Data>({
  getId = defaultGetId,
  transform = rawData => rawData as unknown as Data,
}: {
  getId?: (data: Data) => Id;
  transform?: (rawData: RawData) => Data;
} = {}) {
  type State = PaginationState<Data>;

  /**
   * Add the data to the state.
   * @param draft
   * @param data
   */
  function createOne(draft: State, rawData: RawData): void {
    const data = transform(rawData);
    const id = getId(data);
    draft.entityRecord[id] = data;
  }

  /**
   * Try to read the data with the specified id.
   * If it is not existed, return `undefined`.
   * @param state
   * @param id
   * @returns
   */
  function tryReadOne(state: State, id: Id): Data | undefined {
    return state.entityRecord[id];
  }

  /**
   * Returns a function that accept a `state` as a parameter.
   * It is useful when you are using `useAccessor`.
   * @param id
   * @returns
   * @example
   *
   * ```ts
   * useAccessor(getPostById(id), postAdapter.tryReadOneFactory(id))
   * ```
   */
  function tryReadOneFactory(id: Id): (state: State) => Data | undefined {
    return state => tryReadOne(state, id);
  }

  /**
   * Read the data with the specify id. If the data is not existed, it will throw an error.
   * This function is useful when you are sure that the data is existed.
   *
   * @param state
   * @param id
   * @returns
   */
  function readOne(state: State, id: Id): Data {
    const entity = state.entityRecord[id];
    if (!entity) {
      throw new Error(`Entity with ${id} is not existed. Please use tryReadOne instead.`);
    }

    return entity;
  }

  /**
   * Update the entity with the new data. If the entity is not existed, do nothing.
   * @param draft
   * @param id
   * @param data
   * @returns
   */
  function updateOne(draft: State, id: Id, data: Partial<Data>): void {
    if (!draft.entityRecord[id]) return;
    const cache = draft.entityRecord[id]!;
    draft.entityRecord[id] = { ...cache, ...data };
  }

  /**
   * Delete the entity with the specified id and remove the data from pagination (if existed).
   * @param draft
   * @param id
   */
  function deleteOne(draft: State, id: Id): void {
    const stringifiedId = isNumber(id) ? `${id}` : id;
    delete draft.entityRecord[id];
    for (const paginationMeta of Object.values(draft.paginationMetaRecord)) {
      if (paginationMeta?.ids.includes(id) || paginationMeta?.ids.includes(stringifiedId)) {
        paginationMeta.ids = paginationMeta.ids.filter(
          value => value !== id && value !== stringifiedId
        );
      }
    }
  }

  /**
   * Update the entity with the data. If the entity is not existed, insert it to the state.
   * @param draft
   * @param data
   */
  function upsertOne(draft: State, rawData: RawData): void {
    const data = transform(rawData);
    const id = getId(data);
    const cache = draft.entityRecord[id];
    draft.entityRecord[id] = { ...cache, ...data };
  }

  /**
   * Call `upsertOne` for every data.
   * @param draft
   * @param data
   */
  function upsertMany(draft: State, data: RawData[]): void {
    for (const entity of data) {
      upsertOne(draft, entity);
    }
  }

  function updatePaginationMeta(draft: State, key: string, meta: PaginationMeta): void {
    draft.paginationMetaRecord[key] = meta;
  }

  /**
   * Try to read the pagination meta. If the meta is not existed, return `undefined`.
   * @param state
   * @param key
   * @returns
   */
  function tryReadPaginationMeta(state: State, key: string): PaginationMeta | undefined {
    return state.paginationMetaRecord[key];
  }

  /**
   * This function returns a function that accepts a state as the only one parameter.
   * It is useful when using `useAccessor`.
   * @param key
   * @returns
   */
  function tryReadPaginationMetaFactory(key: string): (state: State) => PaginationMeta | undefined {
    return state => tryReadPaginationMeta(state, key);
  }

  /**
   * Read the pagination meta with the specified key. If it is not existed, throw an error.
   * It is useful when you are sure that the pagination is existed.
   * @param state
   * @param key
   * @returns
   */
  function readPaginationMeta(state: State, key: string): PaginationMeta {
    const meta = tryReadPaginationMeta(state, key);
    if (!meta) {
      throw new Error(
        `pagination meta with key: ${key} is not existed, use tryReadPaginationMeta instead.`
      );
    }
    return meta;
  }

  /**
   * Replace the whole pagination with the given data array.
   * @param draft
   * @param paginationKey
   * @param data
   */
  function replacePagination(draft: State, paginationKey: string, rawData: RawData[]): void {
    upsertMany(draft, rawData);
    const data = rawData.map(transform);
    const ids = data.map(getId);
    draft.paginationMetaRecord[paginationKey] = {
      ids,
      noMore: false,
    };
  }

  /**
   * Append the data to the pagination. If the pagination is not existed, create one.
   * @param draft
   * @param key
   * @param data
   */
  function appendPagination(draft: State, key: string, rawData: RawData[]): void {
    upsertMany(draft, rawData);
    const meta = tryReadPaginationMeta(draft, key) ?? createPaginationMeta();
    const data = rawData.map(transform);
    const ids = data.map(getId);
    const originalIds = meta.ids;
    const set = new Set([...originalIds, ...ids]);
    meta.ids = [...set];
    updatePaginationMeta(draft, key, meta);
  }

  /**
   * Prepend the data to the pagination. If the pagination is not existed, create one.
   * @param draft
   * @param key
   * @param data
   */
  function prependPagination(draft: State, key: string, rawData: RawData[]): void {
    upsertMany(draft, rawData);
    const data = rawData.map(transform);
    const meta = tryReadPaginationMeta(draft, key) ?? createPaginationMeta();
    const ids = data.map(getId);
    const originalIds = meta.ids;
    const set = new Set([...ids, ...originalIds]);
    meta.ids = [...set];
    updatePaginationMeta(draft, key, meta);
  }

  /**
   * Try to read the pagination with the specified key. If it is not existed, return `undefined`.
   * @param state
   * @param key
   * @returns
   */
  function tryReadPagination(state: State, key: string): Pagination<Data> | undefined {
    const meta = tryReadPaginationMeta(state, key);
    if (!meta) return;
    const { ids, ...restMeta } = meta;
    const items = [...ids]
      .map(id => {
        return state.entityRecord[id];
      })
      .filter(isNonNullable);

    return { items, ...restMeta };
  }

  /**
   * Returns a function that accepts state as the only one parameter.
   * If is useful when using `useAccessor`.
   * @param key
   * @returns
   * @example
   * ```ts
   * useAccessor(getPostList(filter), postAdapter.tryReadPaginationFactory(filter));
   * ```
   */
  function tryReadPaginationFactory(key: string): (state: State) => Pagination<Data> | undefined {
    return state => tryReadPagination(state, key);
  }

  /**
   * Read the pagination with the specified key. If the pagination is not existed, throw an error.
   * It is useful when you are sure that the pagination is existed.
   * @param state
   * @param key
   * @returns
   */
  function readPagination(state: State, key: string): Pagination<Data> {
    const pagination = tryReadPagination(state, key);
    if (!pagination) {
      throw new Error(`pagination with key: ${key} is not existed, use tryReadPagination instead`);
    }
    return pagination;
  }

  /**
   * Set the `noMore` property in the pagination meta.
   * @param draft
   * @param key
   * @param noMore
   */
  function setNoMore(draft: State, key: string, noMore: boolean): void {
    const meta = tryReadPaginationMeta(draft, key);
    if (meta) {
      meta.noMore = noMore;
    }
  }

  /**
   * Sort the pagination by the `compare` function.
   */
  function sortPagination(draft: State, key: string, compare: (a: Data, b: Data) => number) {
    const meta = tryReadPaginationMeta(draft, key);
    if (!meta) return;
    const items = meta.ids.map(id => tryReadOne(draft, id)).filter(isNonNullable);
    items.sort(compare);
    meta.ids = items.map(getId);
  }

  return {
    initialState: { entityRecord: {}, paginationMetaRecord: {} } as State,
    createOne,
    tryReadOne,
    tryReadOneFactory,
    readOne,
    updateOne,
    deleteOne,
    upsertOne,
    tryReadPaginationMeta,
    tryReadPaginationMetaFactory,
    readPaginationMeta,
    tryReadPagination,
    tryReadPaginationFactory,
    readPagination,
    replacePagination,
    appendPagination,
    prependPagination,
    setNoMore,
    sortPagination,
  };
}
