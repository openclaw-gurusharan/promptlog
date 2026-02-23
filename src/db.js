import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import path from 'path';

export function getDb() {
  const dbPath = process.env.DB_PATH || './data/db.json';
  const adapter = new JSONFileSync(path.resolve(dbPath));
  const db = new LowSync(adapter, { logs: [] });
  db.read();
  return db;
}
