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

interface PaginationModel<Data> {
  entityRecord: Record<Id, Data | undefined>;
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
  type Model = PaginationModel<Data>;

  /**
   * Add the data to the model
   * @param model
   * @param data
   */
  function createOne(model: Model, rawData: RawData): void {
    const data = transform(rawData);
    const id = getId(data);
    model.entityRecord[id] = data;
  }

  /**
   * Try to read the data with the specified id.
   * If it is not existed, return `undefined`.
   * @param model
   * @param id
   * @returns
   */
  function tryReadOne(model: Model, id: Id): Data | undefined {
    return model.entityRecord[id];
  }

  /**
   * Returns a function that accept a `model` as a parameter.
   * It is useful when you are using `useFetch`.
   * @param id
   * @returns
   * @example
   *
   * ```ts
   * useFetch(getPostById(id), postAdapter.tryReadOneFactory(id))
   * ```
   */
  function tryReadOneFactory(id: Id): (model: Model) => Data | undefined {
    return model => tryReadOne(model, id);
  }

  /**
   * Read the data with the specify id. If the data is not existed, it will throw an error.
   * This function is useful when you are sure that the data is existed.
   *
   * @param model
   * @param id
   * @returns
   */
  function readOne(model: Model, id: Id): Data {
    const entity = model.entityRecord[id];
    if (!entity) {
      throw new Error(`Entity with ${id} is not existed. Please use tryReadOne instead.`);
    }

    return entity;
  }

  /**
   * Update the entity with the new data. If the entity is not existed, do nothing.
   * @param model
   * @param id
   * @param data
   * @returns
   */
  function updateOne(model: Model, id: Id, data: Partial<Data>) {
    if (!model.entityRecord[id]) return;
    const cache = model.entityRecord[id]!;
    model.entityRecord[id] = { ...cache, ...data };
  }

  /**
   * Delete the entity with the specified id and remove the data from pagination (if existed).
   * @param model
   * @param id
   */
  function deleteOne(model: Model, id: Id) {
    delete model.entityRecord[id];
    for (const paginationMeta of Object.values(model.paginationMetaRecord)) {
      if (paginationMeta?.ids.includes(id)) {
        paginationMeta.ids = paginationMeta.ids.filter(value => value !== id);
      }
    }
  }

  /**
   * Update the entity with the data. If the entity is not existed, insert it to the model.
   * @param model
   * @param data
   */
  function upsertOne(model: Model, rawData: RawData) {
    const data = transform(rawData);
    const id = getId(data);
    const cache = model.entityRecord[id];
    model.entityRecord[id] = { ...cache, ...data };
  }

  /**
   * Call `upsertOne` for every data.
   * @param model
   * @param data
   */
  function upsertMany(model: Model, data: RawData[]) {
    for (const entity of data) {
      upsertOne(model, entity);
    }
  }

  function updatePaginationMeta(model: Model, key: string, meta: PaginationMeta): void {
    model.paginationMetaRecord[key] = meta;
  }

  /**
   * Try to read the pagination meta. If the meta is not existed, return `undefined`.
   * @param model
   * @param key
   * @returns
   */
  function tryReadPaginationMeta(model: Model, key: string): PaginationMeta | undefined {
    return model.paginationMetaRecord[key];
  }

  /**
   * This function returns a function that accepts a model as the only one parameter.
   * It is useful when using `useFetch` or `useInfiniteFetch`.
   * @param key
   * @returns
   */
  function tryReadPaginationMetaFactory(key: string): (model: Model) => PaginationMeta | undefined {
    return model => tryReadPaginationMeta(model, key);
  }

  /**
   * Read the pagination with the specified key. If it is not existed, throw an error.
   * It is useful when you are sure that the pagination is existed.
   * @param model
   * @param key
   * @returns
   */
  function readPaginationMeta(model: Model, key: string): PaginationMeta {
    const meta = tryReadPaginationMeta(model, key);
    if (!meta) {
      throw new Error(
        `pagination meta with key: ${key} is not existed, use tryReadPaginationMeta instead.`
      );
    }
    return meta;
  }

  /**
   * Replace the whole pagination with the given data array.
   * @param model
   * @param paginationKey
   * @param data
   */
  function replacePagination(model: Model, paginationKey: string, rawData: RawData[]) {
    upsertMany(model, rawData);
    const data = rawData.map(transform);
    const ids = data.map(getId);
    model.paginationMetaRecord[paginationKey] = {
      ids,
      noMore: false,
    };
  }

  /**
   * Append the data to the pagination. If the pagination is not existed, create one.
   * @param model
   * @param key
   * @param data
   */
  function appendPagination(model: Model, key: string, rawData: RawData[]) {
    upsertMany(model, rawData);
    const meta = tryReadPaginationMeta(model, key) ?? createPaginationMeta();
    const data = rawData.map(transform);
    const ids = data.map(getId);
    const originalIds = meta.ids;
    const set = new Set([...originalIds, ...ids]);
    meta.ids = [...set];
    updatePaginationMeta(model, key, meta);
  }

  /**
   * Prepend the data to the pagination. If the pagination is not existed, create one.
   * @param model
   * @param key
   * @param data
   */
  function prependPagination(model: Model, key: string, rawData: RawData[]) {
    upsertMany(model, rawData);
    const data = rawData.map(transform);
    const meta = tryReadPaginationMeta(model, key) ?? createPaginationMeta();
    const ids = data.map(getId);
    const originalIds = meta.ids;
    const set = new Set([...ids, ...originalIds]);
    meta.ids = [...set];
    updatePaginationMeta(model, key, meta);
  }

  /**
   * Try to read the pagination with the specified key. If it is not existed, return `undefined`.
   * @param model
   * @param key
   * @returns
   */
  function tryReadPagination(model: Model, key: string): Pagination<Data> | undefined {
    const meta = tryReadPaginationMeta(model, key);
    if (!meta) return;
    const { ids, ...restMeta } = meta;
    const items = [...ids]
      .map(id => {
        return model.entityRecord[id];
      })
      .filter(isNonNullable);

    return { items, ...restMeta };
  }

  /**
   * Returns a function that accepts model as the only one parameter.
   * If is useful when using `useFetch` or `useInfiniteFetch`.
   * @param key
   * @returns
   * @example
   * ```ts
   * useInfiniteFetch(getPostList(filter), postAdapter.tryReadPaginationFactory(filter));
   * ```
   */
  function tryReadPaginationFactory(key: string): (model: Model) => Pagination<Data> | undefined {
    return model => tryReadPagination(model, key);
  }

  /**
   * Read the pagination with the specified key. If the pagination is not existed, throw an error.
   * It is useful when you are sure that the pagination is existed.
   * @param model
   * @param key
   * @returns
   */
  function readPagination(model: Model, key: string): Pagination<Data> {
    const pagination = tryReadPagination(model, key);
    if (!pagination) {
      throw new Error(`pagination with key: ${key} is not existed, use tryReadPagination instead`);
    }
    return pagination;
  }

  /**
   * Set the `noMore` property in the pagination meta.
   * @param model
   * @param key
   * @param noMore
   */
  function setNoMore(model: Model, key: string, noMore: boolean): void {
    const meta = tryReadPaginationMeta(model, key);
    if (meta) {
      meta.noMore = noMore;
    }
  }

  return {
    initialModel: { entityRecord: {}, paginationMetaRecord: {} } as Model,
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
  };
}
