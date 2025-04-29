import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface Repository {
  id: number;
  name: string;
  description?: string;
  lastUpdated: Date;
  isPrivate: boolean;
  branches: Branch[];
  files: File[];
}

interface Branch {
  id: number;
  repositoryId: number;
  name: string;
  isDefault: boolean;
  isCurrent: boolean;
  aheadOfDefault: number;
}

interface File {
  id: number;
  repositoryId: number;
  branchId: number;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  lastUpdated: Date;
}

interface Commit {
  id: number;
  repositoryId: number;
  branchId: number;
  message: string;
  author: string;
  timestamp: Date;
}

interface Issue {
  id: number;
  repositoryId: number;
  title: string;
  description?: string;
  status: 'open' | 'closed' | 'in-progress';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

interface PullRequest {
  id: number;
  repositoryId: number;
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'open' | 'merged' | 'closed';
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Pipeline {
  id: number;
  repositoryId: number;
  buildNumber: number;
  status: 'success' | 'failed' | 'running';
  createdAt: Date;
}

interface DataHubDB extends DBSchema {
  repositories: {
    key: number;
    value: Repository;
    indexes: {
      'by-name': string;
      'by-last-updated': Date;
    };
  };
  branches: {
    key: number;
    value: Branch;
    indexes: {
      'by-repository': number;
    };
  };
  files: {
    key: number;
    value: File;
    indexes: {
      'by-repository': number;
      'by-branch': number;
      'by-path': string;
    };
  };
  commits: {
    key: number;
    value: Commit;
    indexes: {
      'by-repository': number;
      'by-branch': number;
      'by-timestamp': Date;
    };
  };
  issues: {
    key: number;
    value: Issue;
    indexes: {
      'by-repository': number;
      'by-status': string;
      'by-priority': string;
    };
  };
  pullRequests: {
    key: number;
    value: PullRequest;
    indexes: {
      'by-repository': number;
      'by-status': string;
    };
  };
  pipelines: {
    key: number;
    value: Pipeline;
    indexes: {
      'by-repository': number;
      'by-build-number': number;
    };
  };
}

// Database version
const DB_VERSION = 1;

// Database name
const DB_NAME = 'datahub-db';

// Singleton instance of the database
let dbInstance: IDBPDatabase<DataHubDB> | null = null;

// Initialize and get database instance
export async function getDB(): Promise<IDBPDatabase<DataHubDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DataHubDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create repositories store
      const repositoriesStore = db.createObjectStore('repositories', { keyPath: 'id', autoIncrement: true });
      repositoriesStore.createIndex('by-name', 'name');
      repositoriesStore.createIndex('by-last-updated', 'lastUpdated');

      // Create branches store
      const branchesStore = db.createObjectStore('branches', { keyPath: 'id', autoIncrement: true });
      branchesStore.createIndex('by-repository', 'repositoryId');

      // Create files store
      const filesStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
      filesStore.createIndex('by-repository', 'repositoryId');
      filesStore.createIndex('by-branch', 'branchId');
      filesStore.createIndex('by-path', 'path');

      // Create commits store
      const commitsStore = db.createObjectStore('commits', { keyPath: 'id', autoIncrement: true });
      commitsStore.createIndex('by-repository', 'repositoryId');
      commitsStore.createIndex('by-branch', 'branchId');
      commitsStore.createIndex('by-timestamp', 'timestamp');

      // Create issues store
      const issuesStore = db.createObjectStore('issues', { keyPath: 'id', autoIncrement: true });
      issuesStore.createIndex('by-repository', 'repositoryId');
      issuesStore.createIndex('by-status', 'status');
      issuesStore.createIndex('by-priority', 'priority');

      // Create pull requests store
      const pullRequestsStore = db.createObjectStore('pullRequests', { keyPath: 'id', autoIncrement: true });
      pullRequestsStore.createIndex('by-repository', 'repositoryId');
      pullRequestsStore.createIndex('by-status', 'status');

      // Create pipelines store
      const pipelinesStore = db.createObjectStore('pipelines', { keyPath: 'id', autoIncrement: true });
      pipelinesStore.createIndex('by-repository', 'repositoryId');
      pipelinesStore.createIndex('by-build-number', 'buildNumber');
    }
  });

  return dbInstance;
}

// Repository operations
export const repositories = {
  async getAll(): Promise<Repository[]> {
    const db = await getDB();
    return db.getAll('repositories');
  },

  async getById(id: number): Promise<Repository | undefined> {
    const db = await getDB();
    return db.get('repositories', id);
  },

  async add(repository: Omit<Repository, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('repositories', repository as any);
  },

  async update(id: number, changes: Partial<Repository>): Promise<void> {
    const db = await getDB();
    const repository = await db.get('repositories', id);
    if (!repository) throw new Error('Repository not found');
    
    const updatedRepository = { ...repository, ...changes };
    await db.put('repositories', updatedRepository);
  },

  async delete(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('repositories', id);
  }
};

// Branch operations
export const branches = {
  async getByRepository(repositoryId: number): Promise<Branch[]> {
    const db = await getDB();
    const index = db.transaction('branches').store.index('by-repository');
    return index.getAll(repositoryId);
  },

  async add(branch: Omit<Branch, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('branches', branch as any);
  },

  async setCurrentBranch(branchId: number, repositoryId: number): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('branches', 'readwrite');
    const index = tx.store.index('by-repository');
    const branches = await index.getAll(repositoryId);
    
    for (const branch of branches) {
      branch.isCurrent = branch.id === branchId;
      await tx.store.put(branch);
    }
    
    await tx.done;
  }
};

// File operations
export const files = {
  async getByRepository(repositoryId: number): Promise<File[]> {
    const db = await getDB();
    const index = db.transaction('files').store.index('by-repository');
    return index.getAll(repositoryId);
  },

  async getByBranch(branchId: number): Promise<File[]> {
    const db = await getDB();
    const index = db.transaction('files').store.index('by-branch');
    return index.getAll(branchId);
  },

  async add(file: Omit<File, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('files', file as any);
  },

  async update(id: number, changes: Partial<File>): Promise<void> {
    const db = await getDB();
    const file = await db.get('files', id);
    if (!file) throw new Error('File not found');
    
    const updatedFile = { ...file, ...changes };
    await db.put('files', updatedFile);
  },

  async delete(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('files', id);
  }
};

// Commit operations
export const commits = {
  async getByRepository(repositoryId: number): Promise<Commit[]> {
    const db = await getDB();
    const index = db.transaction('commits').store.index('by-repository');
    return index.getAll(repositoryId);
  },

  async getByBranch(branchId: number): Promise<Commit[]> {
    const db = await getDB();
    const index = db.transaction('commits').store.index('by-branch');
    return index.getAll(branchId);
  },

  async add(commit: Omit<Commit, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('commits', commit as any);
  }
};

// Issue operations
export const issues = {
  async getByRepository(repositoryId: number): Promise<Issue[]> {
    const db = await getDB();
    const index = db.transaction('issues').store.index('by-repository');
    return index.getAll(repositoryId);
  },

  async getByStatus(status: Issue['status']): Promise<Issue[]> {
    const db = await getDB();
    const index = db.transaction('issues').store.index('by-status');
    return index.getAll(status);
  },

  async add(issue: Omit<Issue, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('issues', issue as any);
  },

  async update(id: number, changes: Partial<Issue>): Promise<void> {
    const db = await getDB();
    const issue = await db.get('issues', id);
    if (!issue) throw new Error('Issue not found');
    
    const updatedIssue = { ...issue, ...changes, updatedAt: new Date() };
    await db.put('issues', updatedIssue);
  }
};

// Pull request operations
export const pullRequests = {
  async getByRepository(repositoryId: number): Promise<PullRequest[]> {
    const db = await getDB();
    const index = db.transaction('pullRequests').store.index('by-repository');
    return index.getAll(repositoryId);
  },

  async add(pullRequest: Omit<PullRequest, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('pullRequests', pullRequest as any);
  },

  async update(id: number, changes: Partial<PullRequest>): Promise<void> {
    const db = await getDB();
    const pullRequest = await db.get('pullRequests', id);
    if (!pullRequest) throw new Error('Pull request not found');
    
    const updatedPR = { ...pullRequest, ...changes, updatedAt: new Date() };
    await db.put('pullRequests', updatedPR);
  }
};

// Pipeline operations
export const pipelines = {
  async getByRepository(repositoryId: number): Promise<Pipeline[]> {
    const db = await getDB();
    const index = db.transaction('pipelines').store.index('by-repository');
    return index.getAll(repositoryId);
  },

  async add(pipeline: Omit<Pipeline, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('pipelines', pipeline as any);
  }
};

// Initialize the database when the module is loaded
getDB().catch(console.error);

export type {
  Repository,
  Branch,
  File,
  Commit,
  Issue,
  PullRequest,
  Pipeline
};
