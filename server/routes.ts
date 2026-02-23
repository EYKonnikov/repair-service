import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createRequestSchema, type RequestStatus, requestStatusEnum } from "@shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "repair-service-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    })
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Неверные учётные данные" });
      }
      (req.session as any).userId = user.id;
      return res.json({ id: user.id, username: user.username, role: user.role, fullName: user.fullName });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Пользователь не найден" });
    return res.json({ id: user.id, username: user.username, role: user.role, fullName: user.fullName });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Вы вышли из системы" });
    });
  });

  app.get("/api/masters", async (_req, res) => {
    const masters = await storage.getMasters();
    return res.json(masters.map((m) => ({ id: m.id, fullName: m.fullName, username: m.username })));
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const parsed = createRequestSchema.parse(req.body);
      const request = await storage.createRequest(parsed);
      return res.status(201).json(request);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/requests", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      if (status && !requestStatusEnum.includes(status as any)) {
        return res.status(400).json({ message: "Недопустимый статус" });
      }
      const list = await storage.getRequests(status as RequestStatus | undefined);
      return res.json(list);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/requests/my", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });
    const list = await storage.getRequestsByMaster(userId);
    return res.json(list);
  });

  app.patch("/api/requests/:id/assign", async (req, res) => {
    try {
      const { masterId } = req.body;
      if (!masterId || typeof masterId !== "number") {
        return res.status(400).json({ message: "Необходимо указать корректного мастера" });
      }
      const masters = await storage.getMasters();
      if (!masters.find((m) => m.id === masterId)) {
        return res.status(400).json({ message: "Мастер не найден" });
      }
      const request = await storage.assignRequest(Number(req.params.id), masterId);
      return res.json(request);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/requests/:id/cancel", async (req, res) => {
    try {
      const request = await storage.cancelRequest(Number(req.params.id));
      return res.json(request);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/requests/:id/take", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Не авторизован" });
      const request = await storage.takeRequest(Number(req.params.id), userId);
      return res.json(request);
    } catch (e: any) {
      if (e.message === "CONFLICT") {
        return res.status(409).json({ message: "Заявка уже взята в работу или её статус изменился" });
      }
      return res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/requests/:id/complete", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Не авторизован" });
      const request = await storage.completeRequest(Number(req.params.id), userId);
      return res.json(request);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  return httpServer;
}
