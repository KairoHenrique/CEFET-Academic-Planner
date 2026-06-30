import type Database from "better-sqlite3";
import {
  getActiveDatabase,
  getActiveSigaaUsername,
  resolveDbPathForUser,
} from "./connection-manager";

export {
  getActiveSigaaUsername,
  normalizeSigaaUsername,
  resolveDbPathForUser,
  resolveUserDataDir,
  runWithUserDb,
  resetConnectionsForTests,
} from "./connection-manager";

export function resolveDbPath(): string {
  return resolveDbPathForUser(getActiveSigaaUsername());
}

const db = new Proxy({} as Database.Database, {
  get(_target, property) {
    const connection = getActiveDatabase();
    const value = Reflect.get(connection, property, connection);
    return typeof value === "function" ? value.bind(connection) : value;
  },
});

export default db;
