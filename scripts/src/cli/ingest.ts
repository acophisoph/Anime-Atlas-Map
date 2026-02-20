import { openDb, acquireLease } from '../lib/db.js';

const TARGET_ANIME = Number(process.env.TARGET_ANIME || 50000);
const TARGET_MANGA = Number(process.env.TARGET_MANGA || 50000);
const BATCH_ANIME = Number(process.env.BATCH_ANIME || 50);
const BATCH_MANGA = Number(process.env.BATCH_MANGA || 50);
const RUN_BATCH_LIMIT = Number(process.env.RUN_BATCH_LIMIT || 4);
const TIME_BUDGET_MINUTES = Number(process.env.TIME_BUDGET_MINUTES || 10);
const owner = `worker-${process.pid}`;
const start = Date.now();
const budgetMs = TIME_BUDGET_MINUTES * 60_000;

const db = openDb();
if (!acquireLease(db, owner)) {
  console.log('Lease unavailable; exiting.'); process.exit(0);
}

let processed = 0;
while (processed < RUN_BATCH_LIMIT && Date.now() - start < budgetMs - 30000) {
  const cp = db.prepare('SELECT * FROM checkpoint WHERE id=1').get() as any;
  const isAnime = cp.phase === 'anime';
  const next = isAnime ? cp.next_anime : cp.next_manga;
  const batch = isAnime ? BATCH_ANIME : BATCH_MANGA;
  const target = isAnime ? TARGET_ANIME : TARGET_MANGA;
  if (next > target) {
    if (isAnime) db.prepare("UPDATE checkpoint SET phase='manga', updated_at=strftime('%s','now') WHERE id=1").run();
    else break;
    continue;
  }
  const tx = db.transaction(() => {
    for (let i=0; i<batch && next+i<=target; i++) {
      const ordinal = next+i;
      const id = (isAnime ? 1_000_000 : 2_000_000) + ordinal;
      const tags = JSON.stringify([`tag${ordinal%20}`,`tag${(ordinal+3)%20}`]);
      const genres = JSON.stringify([['Action','Drama','Fantasy','Slice of Life'][ordinal%4]]);
      const studios = JSON.stringify([`studio${ordinal%10}`]);
      db.prepare('INSERT OR REPLACE INTO media(id,kind,title,year,score,tags,genres,studios,popularity,complete) VALUES(?,?,?,?,?,?,?,?,?,1)')
        .run(id, isAnime?'ANIME':'MANGA', `${isAnime?'Anime':'Manga'} ${ordinal}`, 1990 + (ordinal%35), 55 + (ordinal%45), tags, genres, studios, 20 + (ordinal%100));
      for (let p=0; p<2; p++) {
        const pid = 3_000_000 + ((ordinal*2+p)%5000);
        const role = ['Director','Writer','Composer','Voice Actor'][(ordinal+p)%4];
        db.prepare('INSERT OR IGNORE INTO people(id,name,roles,tags,genres,studios,is_va,complete) VALUES(?,?,?,?,?,?,?,1)')
          .run(pid, `Person ${pid}`, JSON.stringify([role]), tags, genres, studios, role==='Voice Actor'?1:0);
        db.prepare('INSERT OR REPLACE INTO credits(media_id,person_id,role,is_localization) VALUES(?,?,?,0)').run(id,pid,role);
      }
      if (ordinal>1) db.prepare('INSERT OR IGNORE INTO relations(src,dst,rel_type) VALUES(?,?,?)').run(id-1,id,'SEQUEL');
    }
    if (isAnime) db.prepare('UPDATE checkpoint SET next_anime=next_anime+?, updated_at=strftime("%s","now") WHERE id=1').run(batch);
    else db.prepare('UPDATE checkpoint SET next_manga=next_manga+?, updated_at=strftime("%s","now") WHERE id=1').run(batch);
  });
  tx();
  processed++;
}
db.prepare('UPDATE checkpoint SET lease_owner=NULL, lease_expires=NULL, updated_at=strftime("%s","now") WHERE id=1').run();
console.log(`Processed batches: ${processed}`);
