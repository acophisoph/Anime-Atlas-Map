import Database from 'better-sqlite3';
import fs from 'node:fs';

export const DB_PATH = 'scripts/.cache/anime-atlas.sqlite';

export function openDb() {
  fs.mkdirSync('scripts/.cache', { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
  CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY, kind TEXT, title TEXT, year INTEGER, score REAL, tags TEXT, genres TEXT, studios TEXT, popularity REAL, complete INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY, name TEXT, roles TEXT, tags TEXT, genres TEXT, studios TEXT, is_va INTEGER DEFAULT 0, complete INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS relations (src INTEGER, dst INTEGER, rel_type TEXT, PRIMARY KEY(src,dst,rel_type));
  CREATE TABLE IF NOT EXISTS credits (media_id INTEGER, person_id INTEGER, role TEXT, is_localization INTEGER DEFAULT 0, PRIMARY KEY(media_id,person_id,role));
  CREATE TABLE IF NOT EXISTS checkpoint (id INTEGER PRIMARY KEY CHECK(id=1), phase TEXT, next_anime INTEGER, next_manga INTEGER, lease_owner TEXT, lease_expires INTEGER, updated_at INTEGER);
  INSERT OR IGNORE INTO checkpoint(id,phase,next_anime,next_manga,updated_at) VALUES(1,'anime',1,1,strftime('%s','now'));
  `);
  return db;
}

export function acquireLease(db: Database.Database, owner: string, ttlSec = 1800) {
  const now = Math.floor(Date.now()/1000);
  const row = db.prepare('SELECT lease_owner, lease_expires FROM checkpoint WHERE id=1').get() as any;
  if (row.lease_owner && row.lease_expires > now && row.lease_owner !== owner) return false;
  db.prepare('UPDATE checkpoint SET lease_owner=?, lease_expires=?, updated_at=? WHERE id=1').run(owner, now+ttlSec, now);
  return true;
}
