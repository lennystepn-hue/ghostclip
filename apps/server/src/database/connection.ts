import pg from "pg";
import Redis from "ioredis";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://ghostclip:ghostclip@localhost:5432/ghostclip",
});

export const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
);
