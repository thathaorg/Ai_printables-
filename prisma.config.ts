// prisma.config.ts
import { defineConfig, env } from "prisma/config";
import * as dotenv from "dotenv";
import { resolve } from "path";

// ✅ Explicitly load your .env before Prisma reads it
dotenv.config({ path: resolve(process.cwd(), ".env") });

// `prisma generate` (run on every install) doesn't need a real database —
// only migrate/db push do. Fall back to a placeholder instead of crashing
// builds on machines without env vars.
const resolvedDatabaseUrl =
  process.env.DATABASE_URL2 ??
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

// Normalize to DATABASE_URL for Prisma consumption.
process.env.DATABASE_URL = resolvedDatabaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
