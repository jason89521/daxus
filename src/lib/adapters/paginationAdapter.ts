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

export function createPaginationAdapter<Data>({
  getId = defaultGetId,
}: {
  getId?: (data: Data) => Id;
}) {
  type Model = PaginationModel<Data>;

  function createOne(model: Model, data: Data) {
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

  function updateOne(model: Model, id: Id, data: Partial<Data>) {
    if (!model.entityRecord[id]) return;
    const cache = model.entityRecord[id]!;
    model.entityRecord[id] = { ...cache, ...data };
  }

  function deleteOne(model: Model, id: Id) {
    delete model.entityRecord[id];
    for (const paginationMeta of Object.values(model.paginationMetaRecord)) {
      if (paginationMeta?.ids.includes(id)) {
        paginationMeta.ids = paginationMeta.ids.filter(value => value !== id);
      }
    }
  }

  function upsertOne(model: Model, data: Data) {
    const id = getId(data);
    const cache = model.entityRecord[id];
    model.entityRecord[id] = { ...cache, ...data };
  }

  function upsertMany(model: Model, data: Data[]) {
    for (const entity of data) {
      upsertOne(model, entity);
    }
  }

  function replacePagination(model: Model, paginationKey: string, data: Data[]) {
    upsertMany(model, data);
    const ids = data.map(getId);
    model.paginationMetaRecord[paginationKey] = {
      ids,
      noMore: false,
    };
  }

  function appendPagination(model: Model, paginationKey: string, data: Data[]) {
    upsertMany(model, data);
    const ids = data.map(getId);
    const paginationMeta = model.paginationMetaRecord[paginationKey];
    if (!paginationMeta) {
      throw new Error(`Attempting append an undefined pagination!`);
    }
    paginationMeta.ids.push(...ids);
  }

  function readPagination(model: Model, paginationKey: string): Pagination<Data> | undefined {
    const meta = model.paginationMetaRecord[paginationKey];
    if (!meta) return;
    const { ids, ...restMeta } = meta;
    const items = [...ids]
      .map(id => {
        return model.entityRecord[id];
      })
      .filter(isNonNullable);

    return { items, ...restMeta };
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
    readPagination,
    replacePagination,
    appendPagination,
  };
}
