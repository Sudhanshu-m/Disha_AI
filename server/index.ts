import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "dotenv/config"; // ensures .env variables are loaded

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug log for env key loading (only in dev, mask sensitive info)
if (process.env.NODE_ENV !== "production") {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  log(`[ENV] Gemini key loaded: ${key ? key.slice(0, 6) + "..." : "MISSING"}`);
  log(`[ENV] Database URL: ${process.env.DATABASE_URL ? "✅ loaded" : "❌ missing"}`);
}

// API logging middleware
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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("[SERVER ERROR]", err);
  });

  // Setup frontend
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    { port, host: "0.0.0.0" }, // 👈 change from "localhost" so it's reachable in all environments
    () => {
      log(`🚀 Serving on http://localhost:${port}`);
    }
  );
})();
