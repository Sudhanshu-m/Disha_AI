import express, { type Request, Response, NextFunction } from "express";
import router from "./routes";   // ✅ import default router instead of { registerRoutes }
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

// ✅ Attach API routes
app.use("/api", router);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error("[SERVER ERROR]", err);
});

// Start server
(async () => {
  const port = parseInt(process.env.PORT || "5000", 10);

  if (app.get("env") === "development") {
    const server = await setupVite(app);
    server.listen(port, "0.0.0.0", () => {
      log(`🚀 Serving (dev) on http://localhost:${port}`);
    });
  } else {
    serveStatic(app);
    app.listen(port, "0.0.0.0", () => {
      log(`🚀 Serving (prod) on http://localhost:${port}`);
    });
  }
})();
