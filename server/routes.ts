import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertRepositorySchema, insertIssueSchema, insertPipelineSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Repositories routes
  app.get("/api/repositories", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const userId = req.user!.id;
      const repositories = await storage.getRepositoriesByUserId(userId);
      res.json(repositories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/repositories", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const userId = req.user!.id;
      const parsedData = insertRepositorySchema.parse({
        ...req.body,
        userId
      });
      
      const repository = await storage.createRepository(parsedData);
      res.status(201).json(repository);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/repositories/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const repositoryId = parseInt(req.params.id);
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Verify ownership
      if (repository.userId !== req.user!.id) {
        return res.sendStatus(403);
      }
      
      res.json(repository);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/repositories/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const repositoryId = parseInt(req.params.id);
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Verify ownership
      if (repository.userId !== req.user!.id) {
        return res.sendStatus(403);
      }
      
      // Allow updating only specific fields
      const updateSchema = insertRepositorySchema.partial().omit({ userId: true });
      const parsedData = updateSchema.parse(req.body);
      
      const updatedRepository = await storage.updateRepository(repositoryId, parsedData);
      res.json(updatedRepository);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/repositories/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const repositoryId = parseInt(req.params.id);
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Verify ownership
      if (repository.userId !== req.user!.id) {
        return res.sendStatus(403);
      }
      
      await storage.deleteRepository(repositoryId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Issues routes
  app.get("/api/issues", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const userId = req.user!.id;
      const issues = await storage.getIssuesByUserId(userId);
      res.json(issues);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/repositories/:repositoryId/issues", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const repositoryId = parseInt(req.params.repositoryId);
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Verify ownership
      if (repository.userId !== req.user!.id) {
        return res.sendStatus(403);
      }
      
      const issues = await storage.getIssuesByRepositoryId(repositoryId);
      res.json(issues);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/repositories/:repositoryId/issues", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const repositoryId = parseInt(req.params.repositoryId);
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Verify ownership
      if (repository.userId !== req.user!.id) {
        return res.sendStatus(403);
      }
      
      const userId = req.user!.id;
      const parsedData = insertIssueSchema.parse({
        ...req.body,
        repositoryId,
        userId
      });
      
      const issue = await storage.createIssue(parsedData);
      res.status(201).json(issue);
    } catch (error) {
      next(error);
    }
  });

  // Pipelines routes
  app.get("/api/repositories/:repositoryId/pipelines", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const repositoryId = parseInt(req.params.repositoryId);
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Verify ownership
      if (repository.userId !== req.user!.id) {
        return res.sendStatus(403);
      }
      
      const pipelines = await storage.getPipelinesByRepositoryId(repositoryId);
      res.json(pipelines);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/repositories/:repositoryId/pipelines", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const repositoryId = parseInt(req.params.repositoryId);
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Verify ownership
      if (repository.userId !== req.user!.id) {
        return res.sendStatus(403);
      }
      
      const parsedData = insertPipelineSchema.parse({
        ...req.body,
        repositoryId
      });
      
      const pipeline = await storage.createPipeline(parsedData);
      res.status(201).json(pipeline);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
