import { isNonNullable } from '../utils/isNonNullable.js';
import { isNumber } from '../utils/isNumber.js';
import { isString } from '../utils/isString.js';

type Id = string | number;

type Pagination<T> = {
  ids: Id[];
  meta: T;
};

type PaginationWithData<D, M> = {
  data: D[];
} & Pagination<M>;

interface PaginationState<Data, RawData = Data, M = object> {
  entityRecord: Record<string, Data>;
  paginationRecord: Record<string, Pagination<M>>;
  createOne(rawData: RawData): void;
  tryReadOne(id: Id): Data | undefined;
  readOne(id: Id): Data;
  updateOne(id: Id, partialData: Partial<Data>): void;
  deleteOne(id: Id): void;
  upsertOne(rawData: RawData): void;
  upsertMany(rawData: RawData[]): void;
  tryReadPagination(key: string): PaginationWithData<Data, M> | undefined;
  readPagination(key: string): PaginationWithData<Data, M>;
  replacePagination(key: string, rawData: RawData[]): void;
  appendPagination(key: string, rawData: RawData[]): void;
  prependPagination(key: string, rawData: RawData[]): void;
  sortPagination(key: string, compare: (a: Data, b: Data) => number): void;
  updatePagination(key: string, pagination: Partial<Pagination<M>>): void;
}

function defaultSelectId(data: unknown): Id {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    if (isString(data.id) || isNumber(data.id)) {
      return data.id;
    }
    throw new Error(`id: ${data.id} is not string or number`);
  }

  throw new Error('The data does not have id property.');
}

/**
 * @experimental
 */
export function createPaginationState<Data, RawData = Data, M = object>({
  selectId = defaultSelectId,
  transform = rawData => rawData as unknown as Data,
  merge = (from, to) => ({ ...from, ...to }),
  getDefaultMeta = () => ({} as M),
}: {
  selectId?: (data: Data) => Id;
  transform?: (rawData: RawData) => Data;
  merge?: (from: Data, to: Partial<Data>) => Data;
  getDefaultMeta?: () => M;
} = {}): PaginationState<Data, RawData, M> {
  return {
    entityRecord: {},
    paginationRecord: {},
    createOne(rawData) {
      const data = transform(rawData);
      this.entityRecord[selectId(data)] = { ...data };
    },
    tryReadOne(id) {
      return this.entityRecord[id];
    },
    readOne(id) {
      const entity = this.entityRecord[id];
      if (!entity)
        throw new Error(`Entity with ${id} does not exist. Please use tryReadOne instead.`);

      return entity;
    },
    updateOne(id, partialData) {
      const cache = this.entityRecord[id];
      if (!cache) return;
      this.entityRecord[id] = { ...cache, ...partialData };
    },
    deleteOne(id) {
      const stringifiedId = isNumber(id) ? `${id}` : id;
      delete this.entityRecord[id];
      for (const { ids } of Object.values(this.paginationRecord)) {
        const index = (() => {
          const index = ids.indexOf(id);
          return index === -1 ? ids.indexOf(stringifiedId) : index;
        })();
        ids.splice(index, 1);
      }
    },
    upsertMany(rawData) {
      for (const entity of rawData) {
        this.upsertOne(entity);
      }
    },
    upsertOne(rawData) {
      const data = transform(rawData);
      const id = selectId(data);
      const cache = this.entityRecord[id];
      if (cache) {
        this.entityRecord[id] = merge(cache, data);
      } else {
        this.entityRecord[id] = { ...data };
      }
    },
    tryReadPagination(key) {
      const pagination = this.paginationRecord[key];
      if (!pagination) return;

      return {
        ...pagination,
        data: pagination.ids
          ?.map(id => {
            return this.entityRecord[id];
          })
          .filter(isNonNullable),
      };
    },
    readPagination(key) {
      const pagination = this.paginationRecord[key];
      if (!pagination)
        throw new Error(
          `pagination with key: ${key} does not exist, use tryReadPagination instead.`
        );
      return {
        ...pagination,
        data: pagination.ids
          .map(id => {
            return this.entityRecord[id];
          })
          .filter(isNonNullable),
      };
    },
    replacePagination(key, rawData) {
      this.upsertMany(rawData);
      this.paginationRecord[key] = {
        ids: rawData.map(transform).map(selectId),
        meta: getDefaultMeta(),
      };
    },
    appendPagination(key, rawData) {
      this.upsertMany(rawData);
      const ids = rawData.map(transform).map(selectId);
      const oldIds = this.paginationRecord[key]?.ids ?? [];
      const newIds = [...new Set([...oldIds, ...ids])];
      const pagination = this.paginationRecord[key];
      if (pagination) {
        pagination.ids = newIds;
      } else {
        this.paginationRecord[key] = { ids: newIds, meta: getDefaultMeta() };
      }
    },
    prependPagination(key, rawData) {
      this.upsertMany(rawData);
      const ids = rawData.map(transform).map(selectId);
      const oldIds = this.paginationRecord[key]?.ids ?? [];
      const newIds = [...new Set([...ids, ...oldIds])];
      const pagination = this.paginationRecord[key];
      if (pagination) {
        pagination.ids = newIds;
      } else {
        this.paginationRecord[key] = { ids: newIds, meta: getDefaultMeta() };
      }
    },
    sortPagination(key, compare) {
      const pagination = this.paginationRecord[key];
      // If the pagination is empty, then we don't need to sort it.
      if (!pagination) return;
      const items = this.readPagination(key).data;
      items.sort(compare);
      const sortedIds = items.map(selectId);
      pagination.ids = sortedIds;
    },
    updatePagination(key, pagination) {
      const oldPagination = this.paginationRecord[key];
      if (oldPagination) {
        this.paginationRecord[key] = { ...oldPagination, ...pagination };
      } else {
        this.paginationRecord[key] = {
          ids: [],
          meta: getDefaultMeta(),
          ...pagination,
        };
      }
    },
  };
}
