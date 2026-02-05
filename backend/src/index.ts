import express from "express";
import cors from "cors";
import session from "express-session";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { adminRouter } from "./routes/admin";
import { modRouter } from "./routes/mod";

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());

const PgSession = connectPgSimple(session);
const pgPool = new pg.Pool({
  connectionString: env.DATABASE_URL
});

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      createTableIfMissing: true
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/admin", adminRouter);
app.use("/mod", modRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[server] Unhandled error", err);
  res.status(500).json({ error: "internal_server_error" });
});

app.listen(env.PORT, () => {
  console.info(`[server] Listening on http://localhost:${env.PORT}`);
});
