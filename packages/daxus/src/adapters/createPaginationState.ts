import { isNonNullable } from '../utils/isNonNullable.js';
import { isNumber } from '../utils/isNumber.js';
import { isString } from '../utils/isString.js';

type Id = string | number;

interface PaginationState<Data, RawData = Data> {
  entityRecord: Record<string, Data>;
  paginationIdsRecord: Record<string, Id[]>;
  createOne(rawData: RawData): void;
  tryReadOne(id: Id): Data | undefined;
  readOne(id: Id): Data;
  updateOne(id: Id, partialData: Partial<Data>): void;
  deleteOne(id: Id): void;
  upsertOne(rawData: RawData): void;
  upsertMany(rawData: RawData[]): void;
  tryReadPaginationData(key: string): Data[] | undefined;
  readPaginationData(key: string): Data[];
  replacePagination(key: string, rawData: RawData[]): void;
  appendPagination(key: string, rawData: RawData[]): void;
  prependPagination(key: string, rawData: RawData[]): void;
  sortPagination(key: string, compare: (a: Data, b: Data) => number): void;
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
export function createPaginationState<Data, RawData = Data>({
  selectId = defaultSelectId,
  transform = rawData => rawData as unknown as Data,
  merge = (from, to) => ({ ...from, ...to }),
}: {
  selectId?: (data: Data) => Id;
  transform?: (rawData: RawData) => Data;
  merge?: (from: Data, to: Partial<Data>) => Data;
} = {}): PaginationState<Data, RawData> {
  return {
    entityRecord: {},
    paginationIdsRecord: {},
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
      for (const ids of Object.values(this.paginationIdsRecord)) {
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
    tryReadPaginationData(key) {
      return this.paginationIdsRecord[key]
        ?.map(id => {
          return this.entityRecord[id];
        })
        .filter(isNonNullable);
    },
    readPaginationData(key) {
      const ids = this.paginationIdsRecord[key];
      if (!ids)
        throw new Error(
          `pagination with key: ${key} does not exist, use tryReadPaginationData instead.`
        );
      return ids
        .map(id => {
          return this.entityRecord[id];
        })
        .filter(isNonNullable);
    },
    replacePagination(key, rawData) {
      this.upsertMany(rawData);
      this.paginationIdsRecord[key] = rawData.map(transform).map(selectId);
    },
    appendPagination(key, rawData) {
      this.upsertMany(rawData);
      const ids = rawData.map(transform).map(selectId);
      const oldIds = this.paginationIdsRecord[key] ?? [];
      this.paginationIdsRecord[key] = [...new Set([...oldIds, ...ids])];
    },
    prependPagination(key, rawData) {
      this.upsertMany(rawData);
      const ids = rawData.map(transform).map(selectId);
      const oldIds = this.paginationIdsRecord[key] ?? [];
      this.paginationIdsRecord[key] = [...new Set([...ids, ...oldIds])];
    },
    sortPagination(key, compare) {
      const items = this.tryReadPaginationData(key) ?? [];
      items.sort(compare);
      this.paginationIdsRecord[key] = items.map(selectId);
    },
  };
}
