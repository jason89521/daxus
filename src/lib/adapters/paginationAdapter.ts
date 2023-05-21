import { isNumber, isString } from '../utils';

type Id = string | number;

interface PaginationMeta {
  /** Store the ids for each page index. */
  idsPerPage: Id[][];
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
  }

  function upsertOne(model: Model, data: Data) {
    const id = getId(data);
    const cache = model.data[id];
    model.data[id] = { ...cache, ...data };
  }

  function updatePagination(
    model: Model,
    { pageIndex, data, paginationKey }: { pageIndex: number; data: Data[]; paginationKey: string }
  ) {
    // Update the data entities
    for (const entity of data) {
      upsertOne(model, entity);
    }

    const ids = data.map(getId);
    if (pageIndex === 0) {
      model.paginationMetaRecord[paginationKey] = {
        idsPerPage: [ids],
        noMore: false,
        sizePerPage: ids.length,
      };
    } else {
      const pagination = model.paginationMetaRecord[paginationKey];
      if (!pagination) throw new Error(`Pagination is undefined on pageIndex: ${pageIndex}`);
      pagination.idsPerPage[pageIndex] = ids;
      if (ids.length < pagination.sizePerPage) pagination.noMore = true;
    }
  }

  const paginationRecord = {} as Record<string, Data[] | undefined>;

  function getPaginationMeta(model: Model, paginationKey: string) {
    return model.paginationMetaRecord[paginationKey];
  }

  function getPagination(model: Model, paginationKey: string) {
    const paginationMeta = model.paginationMetaRecord[paginationKey];
    const oldPagination = paginationRecord[paginationKey] ?? [];
    if (!paginationMeta) {
      // It will be an empty array.
      paginationRecord[paginationKey] = oldPagination;
      return oldPagination;
    }

    const newPagination = paginationMeta.idsPerPage.flat().map(id => {
      const entity = model.data[id];
      if (!entity) throw new Error(`There is no entity with the id: ${id}`);
      return entity;
    });
    if (oldPagination.length !== newPagination.length) {
      paginationRecord[paginationKey] = newPagination;
      return newPagination;
    }

    const hasChanged = (() => {
      for (let i = 0; i < oldPagination.length; i++) {
        // The reference will be the same if the data don't change.
        if (oldPagination[i] !== newPagination[i]) return true;
      }
      return false;
    })();
    if (hasChanged) {
      paginationRecord[paginationKey] = newPagination;
      return newPagination;
    }

    return oldPagination;
  }

  return {
    initialModel: { data: {}, paginationMetaRecord: {} } as Model,
    createOne,
    readOne,
    updateOne,
    deleteOne,
    upsertOne,
    updatePagination,
    getPaginationMeta,
    getPagination,
  };
}
