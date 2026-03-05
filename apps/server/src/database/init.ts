import { pool } from "./connection";
import fs from "node:fs";
import path from "node:path";

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log("Database schema initialized successfully");
  } finally {
    client.release();
    await pool.end();
  }
}

init().catch(console.error);
