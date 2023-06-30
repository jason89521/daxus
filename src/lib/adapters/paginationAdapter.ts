import { isNumber, isString, isNonNullable } from '../utils';

export type Id = string | number;

export interface PaginationMeta {
  /** Store the ids for each page index. */
  ids: Id[];
  noMore: boolean;
}

export interface Pagination<Data> {
  items: Data[];
  noMore: boolean;
}

export interface PaginationState<Data> {
  entityRecord: Record<string, Data | undefined>;
  paginationMetaRecord: Record<string, PaginationMeta | undefined>;
}

export interface PaginationAdapter<Data, RawData = Data> {
  initialState: PaginationState<Data>;
  /**
   * Add the data to the state.
   */
  createOne(draft: PaginationState<Data>, rawData: RawData): void;
  /**
   * Try to read the data with the specified id.
   * If it is not existed, return `undefined`.
   */
  tryReadOne(state: PaginationState<Data>, id: Id): Data | undefined;
  /**
   * Returns a function that accept a `state` as a parameter.
   * It is useful when you are using `useAccessor`.
   */
  tryReadOneFactory(id: Id): (state: PaginationState<Data>) => Data | undefined;
  /**
   * Read the data with the specify id. If the data is not existed, it will throw an error.
   * This function is useful when you are sure that the data is existed.
   */
  readOne(state: PaginationState<Data>, id: Id): Data;
  /**
   * Update the entity with the new data. If the entity is not existed, do nothing.
   */
  updateOne(draft: PaginationState<Data>, id: Id, data: Partial<Data>): void;
  /**
   * Delete the entity with the specified id and remove the data from pagination (if existed).
   */
  deleteOne(draft: PaginationState<Data>, id: Id): void;
  /**
   * Update the entity with the data. If the entity is not existed, insert it to the state.
   */
  upsertOne(draft: PaginationState<Data>, rawData: RawData): void;
  /**
   * Try to read the pagination meta. If the meta is not existed, return `undefined`.
   */
  tryReadPaginationMeta(state: PaginationState<Data>, key: string): PaginationMeta | undefined;
  /**
   * This function returns a function that accepts a state as the only one parameter.
   * It is useful when using `useAccessor`.
   */
  tryReadPaginationMetaFactory(
    key: string
  ): (state: PaginationState<Data>) => PaginationMeta | undefined;
  /**
   * Read the pagination meta with the specified key. If it is not existed, throw an error.
   * It is useful when you are sure that the pagination is existed.
   */
  readPaginationMeta(state: PaginationState<Data>, key: string): PaginationMeta;
  /**
   * Try to read the pagination with the specified key. If it is not existed, return `undefined`.
   */
  tryReadPagination(state: PaginationState<Data>, key: string): Pagination<Data> | undefined;
  /**
   * Returns a function that accepts state as the only one parameter.
   * If is useful when using `useAccessor`.
   */
  tryReadPaginationFactory(
    key: string
  ): (state: PaginationState<Data>) => Pagination<Data> | undefined;
  /**
   * Read the pagination with the specified key. If the pagination is not existed, throw an error.
   * It is useful when you are sure that the pagination is existed.
   */
  readPagination(state: PaginationState<Data>, key: string): Pagination<Data>;
  /**
   * Replace the whole pagination with the given data array.
   */
  replacePagination(draft: PaginationState<Data>, key: string, data: RawData[]): void;
  /**
   * Append the data to the pagination. If the pagination is not existed, create one.
   */
  appendPagination(draft: PaginationState<Data>, key: string, data: RawData[]): void;
  /**
   * Prepend the data to the pagination. If the pagination is not existed, create one.
   */
  prependPagination(draft: PaginationState<Data>, key: string, data: RawData[]): void;
  /**
   * Set the `noMore` property in the pagination meta.
   */
  setNoMore(draft: PaginationState<Data>, key: string, noMore: boolean): void;
  /**
   * Sort the pagination by the `compare` function.
   */
  sortPagination(
    draft: PaginationState<Data>,
    key: string,
    compare: (a: Data, b: Data) => number
  ): void;
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
} = {}): PaginationAdapter<Data, RawData> {
  type State = PaginationState<Data>;

  function createOne(draft: State, rawData: RawData): void {
    const data = transform(rawData);
    const id = getId(data);
    draft.entityRecord[id] = data;
  }

  function tryReadOne(state: State, id: Id): Data | undefined {
    return state.entityRecord[id];
  }

  function tryReadOneFactory(id: Id): (state: State) => Data | undefined {
    return state => tryReadOne(state, id);
  }

  function readOne(state: State, id: Id): Data {
    const entity = state.entityRecord[id];
    if (!entity) {
      throw new Error(`Entity with ${id} is not existed. Please use tryReadOne instead.`);
    }

    return entity;
  }

  function updateOne(draft: State, id: Id, data: Partial<Data>): void {
    if (!draft.entityRecord[id]) return;
    const cache = draft.entityRecord[id]!;
    draft.entityRecord[id] = { ...cache, ...data };
  }

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

  function tryReadPaginationMeta(state: State, key: string): PaginationMeta | undefined {
    return state.paginationMetaRecord[key];
  }

  function tryReadPaginationMetaFactory(key: string): (state: State) => PaginationMeta | undefined {
    return state => tryReadPaginationMeta(state, key);
  }

  function readPaginationMeta(state: State, key: string): PaginationMeta {
    const meta = tryReadPaginationMeta(state, key);
    if (!meta) {
      throw new Error(
        `pagination meta with key: ${key} is not existed, use tryReadPaginationMeta instead.`
      );
    }
    return meta;
  }

  function replacePagination(draft: State, paginationKey: string, rawData: RawData[]): void {
    upsertMany(draft, rawData);
    const data = rawData.map(transform);
    const ids = data.map(getId);
    draft.paginationMetaRecord[paginationKey] = {
      ids,
      noMore: false,
    };
  }

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

  function tryReadPaginationFactory(key: string): (state: State) => Pagination<Data> | undefined {
    return state => tryReadPagination(state, key);
  }

  function readPagination(state: State, key: string): Pagination<Data> {
    const pagination = tryReadPagination(state, key);
    if (!pagination) {
      throw new Error(`pagination with key: ${key} is not existed, use tryReadPagination instead`);
    }
    return pagination;
  }

  function setNoMore(draft: State, key: string, noMore: boolean): void {
    const meta = tryReadPaginationMeta(draft, key);
    if (meta) {
      meta.noMore = noMore;
    }
  }

  function sortPagination(draft: State, key: string, compare: (a: Data, b: Data) => number) {
    const meta = tryReadPaginationMeta(draft, key);
    if (!meta) return;
    const items = meta.ids.map(id => tryReadOne(draft, id)).filter(isNonNullable);
    items.sort(compare);
    meta.ids = items.map(getId);
  }

  return {
    initialState: { entityRecord: {}, paginationMetaRecord: {} },
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
