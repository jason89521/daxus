import { isNumber, isString } from '../utils';
import { isNonNullable } from '../utils/isNonNullable';

type Id = string | number;

interface PaginationMeta {
  /** Store the ids for each page index. */
  ids: Id[];
  noMore: boolean;
  sizePerPage: number;
}

interface PaginationModel<Data> {
  data: Record<Id, Data | undefined>;
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
    model.data[id] = data;
  }

  function readOne(model: Model, id: Id) {
    return model.data[id];
  }

  function updateOne(model: Model, id: Id, data: Partial<Data>) {
    if (!model.data[id]) return;
    const cache = model.data[id]!;
    model.data[id] = { ...cache, ...data };
  }

  function deleteOne(model: Model, id: Id) {
    delete model.data[id];
    for (const paginationMeta of Object.values(model.paginationMetaRecord)) {
      if (paginationMeta?.ids.includes(id)) {
        paginationMeta.ids = paginationMeta.ids.filter(value => value !== id);
      }
    }
  }

  function upsertOne(model: Model, data: Data) {
    const id = getId(data);
    const cache = model.data[id];
    model.data[id] = { ...cache, ...data };
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
      sizePerPage: ids.length,
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

  function readPagination(model: Model, paginationKey: string) {
    const meta = model.paginationMetaRecord[paginationKey];
    if (!meta) return;
    const { ids, ...restMeta } = meta;
    const items = [...ids]
      .map(id => {
        return model.data[id];
      })
      .filter(isNonNullable);

    return { items, ...restMeta };
  }

  return {
    initialModel: { data: {}, paginationMetaRecord: {} } as Model,
    createOne,
    readOne,
    updateOne,
    deleteOne,
    upsertOne,
    readPagination,
    replacePagination,
    appendPagination,
  };
}
