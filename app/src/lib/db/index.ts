import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export function resolveDbPath(): string {
  return process.env.DB_PATH || path.join(process.cwd(), ".data", "planner.db");
}

const dbPath = resolveDbPath();
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export default db;
