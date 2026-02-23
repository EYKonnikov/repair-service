import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["dispatcher", "master"] }).notNull(),
  fullName: text("full_name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const requestStatusEnum = ["new", "assigned", "in_progress", "done", "canceled"] as const;
export type RequestStatus = typeof requestStatusEnum[number];

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  problemText: text("problem_text").notNull(),
  status: text("status", { enum: ["new", "assigned", "in_progress", "done", "canceled"] }).notNull().default("new"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  version: integer("version").notNull().default(1),
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  status: true,
  assignedTo: true,
  createdAt: true,
  updatedAt: true,
  version: true,
});

export const createRequestSchema = insertRequestSchema.extend({
  clientName: z.string().min(2, "Имя клиента должно содержать минимум 2 символа"),
  phone: z.string().min(5, "Телефон должен содержать минимум 5 символов"),
  address: z.string().min(5, "Адрес должен содержать минимум 5 символов"),
  problemText: z.string().min(10, "Описание проблемы должно содержать минимум 10 символов"),
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
