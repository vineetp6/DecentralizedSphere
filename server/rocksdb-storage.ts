import rocksdb from 'rocksdb';
import path from 'path';
import fs from 'fs-extra';
import { promisify } from 'util';
import { 
  IStorage, 
  User, InsertUser,
  Repository, InsertRepository,
  Issue, InsertIssue,
  Pipeline, InsertPipeline
} from './storage';
import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

// Function to safely stringify and parse objects
const safeStringify = (obj: any) => JSON.stringify(obj);
const safeParse = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

// Convert callback-based RocksDB methods to Promise-based
function promisifyDB(db: any) {
  const asyncDb = {
    get: promisify(db.get).bind(db),
    put: promisify(db.put).bind(db),
    del: promisify(db.del).bind(db),
    batch: promisify(db.batch).bind(db),
    createReadStream: db.createReadStream.bind(db),
    approximateSize: promisify(db.approximateSize).bind(db),
    close: promisify(db.close).bind(db),
  };
  return asyncDb;
}

export class RocksDBStorage implements IStorage {
  private userDb: any;
  private repositoryDb: any;
  private issueDb: any;
  private pipelineDb: any;
  private fileDb: any;

  public sessionStore: session.SessionStore;

  private userIdCounter: number = 1;
  private repositoryIdCounter: number = 1;
  private issueIdCounter: number = 1;
  private pipelineIdCounter: number = 1;
  private fileIdCounter: number = 1;

  constructor() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    fs.ensureDirSync(dataDir);

    // Initialize RocksDB instances for each data type
    this.userDb = promisifyDB(rocksdb(path.join(dataDir, 'users')));
    this.repositoryDb = promisifyDB(rocksdb(path.join(dataDir, 'repositories')));
    this.issueDb = promisifyDB(rocksdb(path.join(dataDir, 'issues')));
    this.pipelineDb = promisifyDB(rocksdb(path.join(dataDir, 'pipelines')));
    this.fileDb = promisifyDB(rocksdb(path.join(dataDir, 'files')));

    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h expiry
    });

    // Load counters from DB
    this.initializeCounters();
  }

  private async initializeCounters() {
    try {
      // Try to load counters
      const userCounter = await this.userDb.get('idCounter').catch(() => null);
      const repoCounter = await this.repositoryDb.get('idCounter').catch(() => null);
      const issueCounter = await this.issueDb.get('idCounter').catch(() => null);
      const pipelineCounter = await this.pipelineDb.get('idCounter').catch(() => null);
      const fileCounter = await this.fileDb.get('idCounter').catch(() => null);

      // Set counters if they exist
      if (userCounter) this.userIdCounter = parseInt(userCounter);
      if (repoCounter) this.repositoryIdCounter = parseInt(repoCounter);
      if (issueCounter) this.issueIdCounter = parseInt(issueCounter);
      if (pipelineCounter) this.pipelineIdCounter = parseInt(pipelineCounter);
      if (fileCounter) this.fileIdCounter = parseInt(fileCounter);
    } catch (error) {
      console.error('Error initializing counters:', error);
    }
  }

  private async saveCounter(db: any, counter: number) {
    await db.put('idCounter', counter.toString());
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const userData = await this.userDb.get(`user:${id}`);
      return userData ? safeParse(userData) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Get all users and find by username
      const users: User[] = [];
      return new Promise((resolve) => {
        this.userDb.createReadStream()
          .on('data', (data: { key: string, value: string }) => {
            if (data.key.startsWith('user:')) {
              const user = safeParse(data.value);
              if (user && user.username === username) {
                resolve(user);
              }
              users.push(user);
            }
          })
          .on('end', () => {
            resolve(undefined);
          });
      });
    } catch (error) {
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    
    await this.userDb.put(`user:${id}`, safeStringify(user));
    await this.saveCounter(this.userDb, this.userIdCounter);
    
    return user;
  }

  // Repository methods
  async getRepository(id: number): Promise<Repository | undefined> {
    try {
      const repoData = await this.repositoryDb.get(`repo:${id}`);
      return repoData ? safeParse(repoData) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getRepositoriesByUserId(userId: number): Promise<Repository[]> {
    const repositories: Repository[] = [];
    
    return new Promise((resolve) => {
      this.repositoryDb.createReadStream()
        .on('data', (data: { key: string, value: string }) => {
          if (data.key.startsWith('repo:')) {
            const repo = safeParse(data.value);
            if (repo && repo.userId === userId) {
              repositories.push(repo);
            }
          }
        })
        .on('end', () => {
          resolve(repositories);
        });
    });
  }

  async createRepository(repository: InsertRepository): Promise<Repository> {
    const id = this.repositoryIdCounter++;
    const now = new Date();
    
    const newRepository: Repository = { 
      ...repository, 
      id, 
      lastUpdated: now 
    };
    
    await this.repositoryDb.put(`repo:${id}`, safeStringify(newRepository));
    await this.saveCounter(this.repositoryDb, this.repositoryIdCounter);
    
    return newRepository;
  }

  async updateRepository(id: number, repository: Partial<InsertRepository>): Promise<Repository | undefined> {
    try {
      const existingRepo = await this.getRepository(id);
      if (!existingRepo) return undefined;
      
      const updatedRepository: Repository = {
        ...existingRepo,
        ...repository,
        lastUpdated: new Date()
      };
      
      await this.repositoryDb.put(`repo:${id}`, safeStringify(updatedRepository));
      return updatedRepository;
    } catch (error) {
      return undefined;
    }
  }

  async deleteRepository(id: number): Promise<boolean> {
    try {
      await this.repositoryDb.del(`repo:${id}`);
      
      // Delete associated issues and pipelines
      const issues = await this.getIssuesByRepositoryId(id);
      const pipelines = await this.getPipelinesByRepositoryId(id);
      
      const batch = issues.map(issue => ({ type: 'del', key: `issue:${issue.id}` }))
        .concat(pipelines.map(pipeline => ({ type: 'del', key: `pipeline:${pipeline.id}` })));
      
      if (batch.length > 0) {
        await this.issueDb.batch(batch.filter(item => item.key.startsWith('issue:')));
        await this.pipelineDb.batch(batch.filter(item => item.key.startsWith('pipeline:')));
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Issue methods
  async getIssue(id: number): Promise<Issue | undefined> {
    try {
      const issueData = await this.issueDb.get(`issue:${id}`);
      return issueData ? safeParse(issueData) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getIssuesByRepositoryId(repositoryId: number): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    return new Promise((resolve) => {
      this.issueDb.createReadStream()
        .on('data', (data: { key: string, value: string }) => {
          if (data.key.startsWith('issue:')) {
            const issue = safeParse(data.value);
            if (issue && issue.repositoryId === repositoryId) {
              issues.push(issue);
            }
          }
        })
        .on('end', () => {
          resolve(issues);
        });
    });
  }

  async getIssuesByUserId(userId: number): Promise<Issue[]> {
    const issues: Issue[] = [];
    const repos = await this.getRepositoriesByUserId(userId);
    const repoIds = repos.map(repo => repo.id);
    
    return new Promise((resolve) => {
      this.issueDb.createReadStream()
        .on('data', (data: { key: string, value: string }) => {
          if (data.key.startsWith('issue:')) {
            const issue = safeParse(data.value);
            if (issue && repoIds.includes(issue.repositoryId)) {
              issues.push(issue);
            }
          }
        })
        .on('end', () => {
          resolve(issues);
        });
    });
  }

  async createIssue(issue: InsertIssue): Promise<Issue> {
    const id = this.issueIdCounter++;
    const now = new Date();
    
    const newIssue: Issue = {
      ...issue,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    await this.issueDb.put(`issue:${id}`, safeStringify(newIssue));
    await this.saveCounter(this.issueDb, this.issueIdCounter);
    
    return newIssue;
  }

  async updateIssue(id: number, issue: Partial<InsertIssue>): Promise<Issue | undefined> {
    try {
      const existingIssue = await this.getIssue(id);
      if (!existingIssue) return undefined;
      
      const updatedIssue: Issue = {
        ...existingIssue,
        ...issue,
        updatedAt: new Date()
      };
      
      await this.issueDb.put(`issue:${id}`, safeStringify(updatedIssue));
      return updatedIssue;
    } catch (error) {
      return undefined;
    }
  }

  async deleteIssue(id: number): Promise<boolean> {
    try {
      await this.issueDb.del(`issue:${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Pipeline methods
  async getPipeline(id: number): Promise<Pipeline | undefined> {
    try {
      const pipelineData = await this.pipelineDb.get(`pipeline:${id}`);
      return pipelineData ? safeParse(pipelineData) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getPipelinesByRepositoryId(repositoryId: number): Promise<Pipeline[]> {
    const pipelines: Pipeline[] = [];
    
    return new Promise((resolve) => {
      this.pipelineDb.createReadStream()
        .on('data', (data: { key: string, value: string }) => {
          if (data.key.startsWith('pipeline:')) {
            const pipeline = safeParse(data.value);
            if (pipeline && pipeline.repositoryId === repositoryId) {
              pipelines.push(pipeline);
            }
          }
        })
        .on('end', () => {
          resolve(pipelines);
        });
    });
  }

  async createPipeline(pipeline: InsertPipeline): Promise<Pipeline> {
    const id = this.pipelineIdCounter++;
    const now = new Date();
    
    const newPipeline: Pipeline = {
      ...pipeline,
      id,
      createdAt: now
    };
    
    await this.pipelineDb.put(`pipeline:${id}`, safeStringify(newPipeline));
    await this.saveCounter(this.pipelineDb, this.pipelineIdCounter);
    
    return newPipeline;
  }

  // File methods
  async saveFile(repositoryId: number, path: string, content: string): Promise<{ id: number; path: string }> {
    const id = this.fileIdCounter++;
    const fileInfo = { id, repositoryId, path, content };
    
    await this.fileDb.put(`file:${id}`, safeStringify(fileInfo));
    await this.saveCounter(this.fileDb, this.fileIdCounter);
    
    return { id, path };
  }

  async getFile(id: number): Promise<{ id: number; repositoryId: number; path: string; content: string } | undefined> {
    try {
      const fileData = await this.fileDb.get(`file:${id}`);
      return fileData ? safeParse(fileData) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getFilesByRepository(repositoryId: number): Promise<{ id: number; path: string }[]> {
    const files: { id: number; path: string }[] = [];
    
    return new Promise((resolve) => {
      this.fileDb.createReadStream()
        .on('data', (data: { key: string, value: string }) => {
          if (data.key.startsWith('file:')) {
            const file = safeParse(data.value);
            if (file && file.repositoryId === repositoryId) {
              files.push({ id: file.id, path: file.path });
            }
          }
        })
        .on('end', () => {
          resolve(files);
        });
    });
  }

  async updateFile(id: number, content: string): Promise<boolean> {
    try {
      const file = await this.getFile(id);
      if (!file) return false;
      
      const updatedFile = { ...file, content };
      await this.fileDb.put(`file:${id}`, safeStringify(updatedFile));
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteFile(id: number): Promise<boolean> {
    try {
      await this.fileDb.del(`file:${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}