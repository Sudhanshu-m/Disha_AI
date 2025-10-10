// ==============================
// server/index.ts
// ==============================

// 1️⃣ Load environment variables BEFORE anything else
import dotenv from "dotenv";
dotenv.config();

// 2️⃣ Import dependencies
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// 3️⃣ Debug log for env key loading (only in dev, mask sensitive info)
if (process.env.NODE_ENV !== "production") {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  console.log(`[ENV] GEMINI key loaded: ${key ? key.slice(0, 6) + "..." : "❌ MISSING"}`);
  console.log(`[ENV] Database URL: ${process.env.DATABASE_URL ? "✅ loaded" : "❌ missing"}`);
}

// 4️⃣ Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 5️⃣ API logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// 6️⃣ Main async function
(async () => {
  const server = await registerRoutes(app);

  // 7️⃣ Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("[SERVER ERROR]", err);
  });

  // 8️⃣ Frontend setup
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 9️⃣ Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    { port, host: "0.0.0.0" }, // reachable in all environments
    () => {
      log(`🚀 Server running on http://localhost:${port}`);
    }
  );
})();
