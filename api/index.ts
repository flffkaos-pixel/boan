import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { registerStorageProxy } from "./server/_core/storageProxy";
import { registerOAuthRoutes } from "./server/_core/oauth";
import { appRouter } from "./server/routers";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./server/_core/context";
import net from "net";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;