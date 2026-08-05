import { DB_NAME, DB_VERSION, STORES, type StoreName } from "@/lib/db/schema";

let dbPromise: Promise<IDBDatabase> | null = null;

function ensureBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
}

function createStoreIndexes(store: IDBObjectStore, storeName: StoreName): void {
  switch (storeName) {
    case STORES.layouts:
      store.createIndex("projectId", "projectId", { unique: true });
      store.createIndex("orchardId", "orchardId", { unique: false });
      break;
    case STORES.blocks:
      store.createIndex("orchardId", "orchardId", { unique: false });
      break;
    case STORES.grids:
      store.createIndex("layoutId", "layoutId", { unique: false });
      store.createIndex("blockId", "blockId", { unique: false });
      break;
    case STORES.vines:
      store.createIndex("gridId", "gridId", { unique: false });
      store.createIndex("treatmentId", "treatmentId", { unique: false });
      break;
    case STORES.treatments:
      store.createIndex("layoutId", "layoutId", { unique: false });
      break;
    case STORES.mapObjects:
      store.createIndex("layoutId", "layoutId", { unique: false });
      break;
    case STORES.mapTexts:
      store.createIndex("layoutId", "layoutId", { unique: false });
      break;
    case STORES.rows:
      store.createIndex("gridId", "gridId", { unique: false });
      store.createIndex("gridId_index", ["gridId", "index"], { unique: true });
      break;
    default:
      break;
  }
}

export function openDatabase(): Promise<IDBDatabase> {
  ensureBrowser();

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error ?? new Error("Failed to open IndexedDB"));
      };

      request.onupgradeneeded = () => {
        const db = request.result;

        (Object.values(STORES) as StoreName[]).forEach((storeName) => {
          if (db.objectStoreNames.contains(storeName)) {
            return;
          }

          const store =
            storeName === STORES.meta
              ? db.createObjectStore(storeName, { keyPath: "key" })
              : db.createObjectStore(storeName, { keyPath: "id" });

          createStoreIndexes(store, storeName);
        });

        const tx = request.transaction;
        if (tx) {
          tx.objectStore(STORES.meta).put({
            key: "schemaVersion",
            value: DB_VERSION,
          });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  return dbPromise;
}

export type TransactionMode = IDBTransactionMode;

export async function runTransaction<T>(
  storeNames: StoreName[],
  mode: TransactionMode,
  handler: (transaction: IDBTransaction) => Promise<T>
): Promise<T> {
  const db = await openDatabase();
  const transaction = db.transaction(storeNames, mode);

  try {
    const result = await handler(transaction);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    });

    return result;
  } catch (error) {
    transaction.abort();
    throw error;
  }
}

export function getStore(
  transaction: IDBTransaction,
  storeName: StoreName
): IDBObjectStore {
  return transaction.objectStore(storeName);
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function getById<T extends { id: string }>(
  store: IDBObjectStore,
  id: string
): Promise<T | undefined> {
  const result = await requestToPromise(store.get(id));
  return result as T | undefined;
}

export async function getAllByIndex<T>(
  store: IDBObjectStore,
  indexName: string,
  key: IDBValidKey
): Promise<T[]> {
  const index = store.index(indexName);
  const result = await requestToPromise(index.getAll(key));
  return result as T[];
}

export async function deleteAllByIndex(
  store: IDBObjectStore,
  indexName: string,
  key: IDBValidKey
): Promise<void> {
  const index = store.index(indexName);
  const keys = await requestToPromise(index.getAllKeys(key));

  await Promise.all(
    keys.map((entryKey) => requestToPromise(store.delete(entryKey)))
  );
}

export async function putAll<T extends { id: string }>(
  store: IDBObjectStore,
  records: T[]
): Promise<void> {
  await Promise.all(records.map((record) => requestToPromise(store.put(record))));
}

export async function deleteById(
  store: IDBObjectStore,
  id: string
): Promise<void> {
  await requestToPromise(store.delete(id));
}

export async function replaceByIndex<T extends { id: string }>(
  store: IDBObjectStore,
  indexName: string,
  indexKey: IDBValidKey,
  records: T[]
): Promise<void> {
  await deleteAllByIndex(store, indexName, indexKey);
  await putAll(store, records);
}
