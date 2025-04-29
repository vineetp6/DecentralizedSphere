import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Repository schema
export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  isPrivate: boolean("is_private").default(false),
});

export const insertRepositorySchema = createInsertSchema(repositories).pick({
  name: true,
  description: true,
  userId: true,
  isPrivate: true,
});

export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Repository = typeof repositories.$inferSelect;

// Issue schema
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  repositoryId: integer("repository_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIssueSchema = createInsertSchema(issues).pick({
  title: true,
  description: true,
  repositoryId: true,
  userId: true,
  status: true,
  priority: true,
});

export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;

// Pipeline schema
export const pipelines = pgTable("pipelines", {
  id: serial("id").primaryKey(),
  buildNumber: integer("build_number").notNull(),
  repositoryId: integer("repository_id").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPipelineSchema = createInsertSchema(pipelines).pick({
  buildNumber: true,
  repositoryId: true,
  status: true,
});

export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type Pipeline = typeof pipelines.$inferSelect;
