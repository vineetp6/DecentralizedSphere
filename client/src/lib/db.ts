// A simple IndexedDB wrapper for local data storage

const DB_NAME = 'datahub';
const DB_VERSION = 1;

export enum StoreNames {
  REPOSITORIES = 'repositories',
  FILES = 'files',
  BRANCHES = 'branches',
  COMMITS = 'commits',
  PULL_REQUESTS = 'pullRequests',
  ISSUES = 'issues',
  PIPELINES = 'pipelines',
  NOTIFICATIONS = 'notifications',
}

interface DBSchema {
  [StoreNames.REPOSITORIES]: {
    key: number;
    value: any;
  };
  [StoreNames.FILES]: {
    key: number;
    value: any;
    indexes: { 'by-repo': number; 'by-branch': number; };
  };
  [StoreNames.BRANCHES]: {
    key: number;
    value: any;
    indexes: { 'by-repo': number; };
  };
  [StoreNames.COMMITS]: {
    key: number;
    value: any;
    indexes: { 'by-repo': number; 'by-branch': number; };
  };
  [StoreNames.PULL_REQUESTS]: {
    key: number;
    value: any;
    indexes: { 'by-repo': number; };
  };
  [StoreNames.ISSUES]: {
    key: number;
    value: any;
    indexes: { 'by-repo': number; };
  };
  [StoreNames.PIPELINES]: {
    key: number;
    value: any;
    indexes: { 'by-repo': number; };
  };
  [StoreNames.NOTIFICATIONS]: {
    key: number;
    value: any;
  };
}

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Repositories store
      if (!db.objectStoreNames.contains(StoreNames.REPOSITORIES)) {
        db.createObjectStore(StoreNames.REPOSITORIES, { keyPath: 'id', autoIncrement: true });
      }

      // Files store
      if (!db.objectStoreNames.contains(StoreNames.FILES)) {
        const filesStore = db.createObjectStore(StoreNames.FILES, { keyPath: 'id', autoIncrement: true });
        filesStore.createIndex('by-repo', 'repositoryId', { unique: false });
        filesStore.createIndex('by-branch', 'branchId', { unique: false });
      }

      // Branches store
      if (!db.objectStoreNames.contains(StoreNames.BRANCHES)) {
        const branchesStore = db.createObjectStore(StoreNames.BRANCHES, { keyPath: 'id', autoIncrement: true });
        branchesStore.createIndex('by-repo', 'repositoryId', { unique: false });
      }

      // Commits store
      if (!db.objectStoreNames.contains(StoreNames.COMMITS)) {
        const commitsStore = db.createObjectStore(StoreNames.COMMITS, { keyPath: 'id', autoIncrement: true });
        commitsStore.createIndex('by-repo', 'repositoryId', { unique: false });
        commitsStore.createIndex('by-branch', 'branchId', { unique: false });
      }

      // Pull Requests store
      if (!db.objectStoreNames.contains(StoreNames.PULL_REQUESTS)) {
        const prStore = db.createObjectStore(StoreNames.PULL_REQUESTS, { keyPath: 'id', autoIncrement: true });
        prStore.createIndex('by-repo', 'repositoryId', { unique: false });
      }

      // Issues store
      if (!db.objectStoreNames.contains(StoreNames.ISSUES)) {
        const issuesStore = db.createObjectStore(StoreNames.ISSUES, { keyPath: 'id', autoIncrement: true });
        issuesStore.createIndex('by-repo', 'repositoryId', { unique: false });
      }

      // Pipelines store
      if (!db.objectStoreNames.contains(StoreNames.PIPELINES)) {
        const pipelinesStore = db.createObjectStore(StoreNames.PIPELINES, { keyPath: 'id', autoIncrement: true });
        pipelinesStore.createIndex('by-repo', 'repositoryId', { unique: false });
      }

      // Notifications store
      if (!db.objectStoreNames.contains(StoreNames.NOTIFICATIONS)) {
        db.createObjectStore(StoreNames.NOTIFICATIONS, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function addItem<T extends keyof DBSchema>(
  storeName: T,
  item: Omit<DBSchema[T]['value'], 'id'>
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function updateItem<T extends keyof DBSchema>(
  storeName: T,
  item: DBSchema[T]['value']
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function deleteItem<T extends keyof DBSchema>(
  storeName: T,
  id: number
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function getItem<T extends keyof DBSchema>(
  storeName: T,
  id: number
): Promise<DBSchema[T]['value'] | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || undefined);
    };

    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function getAllItems<T extends keyof DBSchema>(
  storeName: T
): Promise<DBSchema[T]['value'][]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function getItemsByIndex<T extends keyof DBSchema>(
  storeName: T,
  indexName: keyof DBSchema[T]['indexes'],
  value: any
): Promise<DBSchema[T]['value'][]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName as string);
    const request = index.getAll(value);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function clearStore<T extends keyof DBSchema>(storeName: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Initialize the database
export async function initDatabase() {
  try {
    await openDB();
    console.log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
  }
}
