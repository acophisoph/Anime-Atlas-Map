import { openDb } from '../lib/db.js';
const db = openDb();
const cp = db.prepare('SELECT * FROM checkpoint WHERE id=1').get();
const media = db.prepare('SELECT COUNT(*) as c FROM media').get() as any;
const people = db.prepare('SELECT COUNT(*) as c FROM people').get() as any;
console.log({ checkpoint: cp, media: media.c, people: people.c });
