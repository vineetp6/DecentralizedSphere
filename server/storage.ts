import { users, type User, type InsertUser, repositories, type Repository, type InsertRepository, issues, type Issue, type InsertIssue, pipelines, type Pipeline, type InsertPipeline } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Repository methods
  getRepository(id: number): Promise<Repository | undefined>;
  getRepositoriesByUserId(userId: number): Promise<Repository[]>;
  createRepository(repository: InsertRepository): Promise<Repository>;
  updateRepository(id: number, repository: Partial<InsertRepository>): Promise<Repository | undefined>;
  deleteRepository(id: number): Promise<boolean>;
  
  // Issue methods
  getIssue(id: number): Promise<Issue | undefined>;
  getIssuesByRepositoryId(repositoryId: number): Promise<Issue[]>;
  getIssuesByUserId(userId: number): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, issue: Partial<InsertIssue>): Promise<Issue | undefined>;
  deleteIssue(id: number): Promise<boolean>;
  
  // Pipeline methods
  getPipeline(id: number): Promise<Pipeline | undefined>;
  getPipelinesByRepositoryId(repositoryId: number): Promise<Pipeline[]>;
  createPipeline(pipeline: InsertPipeline): Promise<Pipeline>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private repositories: Map<number, Repository>;
  private issues: Map<number, Issue>;
  private pipelines: Map<number, Pipeline>;
  
  public sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private repositoryIdCounter: number;
  private issueIdCounter: number;
  private pipelineIdCounter: number;

  constructor() {
    this.users = new Map();
    this.repositories = new Map();
    this.issues = new Map();
    this.pipelines = new Map();
    
    this.userIdCounter = 1;
    this.repositoryIdCounter = 1;
    this.issueIdCounter = 1;
    this.pipelineIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Repository methods
  async getRepository(id: number): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }
  
  async getRepositoriesByUserId(userId: number): Promise<Repository[]> {
    return Array.from(this.repositories.values()).filter(
      (repository) => repository.userId === userId
    );
  }
  
  async createRepository(repository: InsertRepository): Promise<Repository> {
    const id = this.repositoryIdCounter++;
    const now = new Date();
    const newRepository: Repository = { 
      ...repository, 
      id, 
      lastUpdated: now 
    };
    this.repositories.set(id, newRepository);
    return newRepository;
  }
  
  async updateRepository(id: number, repository: Partial<InsertRepository>): Promise<Repository | undefined> {
    const existingRepository = this.repositories.get(id);
    if (!existingRepository) return undefined;
    
    const updatedRepository: Repository = {
      ...existingRepository,
      ...repository,
      lastUpdated: new Date()
    };
    
    this.repositories.set(id, updatedRepository);
    return updatedRepository;
  }
  
  async deleteRepository(id: number): Promise<boolean> {
    return this.repositories.delete(id);
  }
  
  // Issue methods
  async getIssue(id: number): Promise<Issue | undefined> {
    return this.issues.get(id);
  }
  
  async getIssuesByRepositoryId(repositoryId: number): Promise<Issue[]> {
    return Array.from(this.issues.values()).filter(
      (issue) => issue.repositoryId === repositoryId
    );
  }
  
  async getIssuesByUserId(userId: number): Promise<Issue[]> {
    return Array.from(this.issues.values()).filter(
      (issue) => issue.userId === userId
    );
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
    this.issues.set(id, newIssue);
    return newIssue;
  }
  
  async updateIssue(id: number, issue: Partial<InsertIssue>): Promise<Issue | undefined> {
    const existingIssue = this.issues.get(id);
    if (!existingIssue) return undefined;
    
    const updatedIssue: Issue = {
      ...existingIssue,
      ...issue,
      updatedAt: new Date()
    };
    
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }
  
  async deleteIssue(id: number): Promise<boolean> {
    return this.issues.delete(id);
  }
  
  // Pipeline methods
  async getPipeline(id: number): Promise<Pipeline | undefined> {
    return this.pipelines.get(id);
  }
  
  async getPipelinesByRepositoryId(repositoryId: number): Promise<Pipeline[]> {
    return Array.from(this.pipelines.values()).filter(
      (pipeline) => pipeline.repositoryId === repositoryId
    );
  }
  
  async createPipeline(pipeline: InsertPipeline): Promise<Pipeline> {
    const id = this.pipelineIdCounter++;
    const now = new Date();
    const newPipeline: Pipeline = {
      ...pipeline,
      id,
      createdAt: now
    };
    this.pipelines.set(id, newPipeline);
    return newPipeline;
  }
}

export const storage = new MemStorage();
