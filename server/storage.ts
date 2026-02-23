import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  users,
  requests,
  type User,
  type InsertUser,
  type InsertRequest,
  type Request,
  type RequestStatus,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMasters(): Promise<User[]>;

  createRequest(data: InsertRequest): Promise<Request>;
  getRequests(statusFilter?: RequestStatus): Promise<Request[]>;
  getRequestsByMaster(masterId: number): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  assignRequest(requestId: number, masterId: number): Promise<Request>;
  cancelRequest(requestId: number): Promise<Request>;
  takeRequest(requestId: number, masterId: number): Promise<Request>;
  completeRequest(requestId: number, masterId: number): Promise<Request>;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const db = drizzle(process.env.DATABASE_URL);

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getMasters(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "master"));
  }

  async createRequest(data: InsertRequest): Promise<Request> {
    const [request] = await db
      .insert(requests)
      .values({ ...data, status: "new" })
      .returning();
    return request;
  }

  async getRequests(statusFilter?: RequestStatus): Promise<Request[]> {
    if (statusFilter) {
      return db
        .select()
        .from(requests)
        .where(eq(requests.status, statusFilter))
        .orderBy(requests.createdAt);
    }
    return db.select().from(requests).orderBy(requests.createdAt);
  }

  async getRequestsByMaster(masterId: number): Promise<Request[]> {
    return db
      .select()
      .from(requests)
      .where(eq(requests.assignedTo, masterId))
      .orderBy(requests.createdAt);
  }

  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }

  async assignRequest(requestId: number, masterId: number): Promise<Request> {
    const [updated] = await db
      .update(requests)
      .set({
        assignedTo: masterId,
        status: "assigned",
        updatedAt: new Date(),
        version: sql`${requests.version} + 1`,
      })
      .where(and(eq(requests.id, requestId), eq(requests.status, "new")))
      .returning();

    if (!updated) {
      throw new Error("Request not found or not in 'new' status");
    }
    return updated;
  }

  async cancelRequest(requestId: number): Promise<Request> {
    const [updated] = await db
      .update(requests)
      .set({
        status: "canceled",
        updatedAt: new Date(),
        version: sql`${requests.version} + 1`,
      })
      .where(
        and(
          eq(requests.id, requestId),
          sql`${requests.status} IN ('new', 'assigned')`
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Request not found or cannot be canceled");
    }
    return updated;
  }

  async takeRequest(requestId: number, masterId: number): Promise<Request> {
    const [updated] = await db
      .update(requests)
      .set({
        status: "in_progress",
        updatedAt: new Date(),
        version: sql`${requests.version} + 1`,
      })
      .where(
        and(
          eq(requests.id, requestId),
          eq(requests.status, "assigned"),
          eq(requests.assignedTo, masterId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("CONFLICT");
    }
    return updated;
  }

  async completeRequest(requestId: number, masterId: number): Promise<Request> {
    const [updated] = await db
      .update(requests)
      .set({
        status: "done",
        updatedAt: new Date(),
        version: sql`${requests.version} + 1`,
      })
      .where(
        and(
          eq(requests.id, requestId),
          eq(requests.status, "in_progress"),
          eq(requests.assignedTo, masterId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Request not found or not in 'in_progress' status");
    }
    return updated;
  }
}

export const storage = new DatabaseStorage();
