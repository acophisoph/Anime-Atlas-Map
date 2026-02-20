import fs from 'node:fs';
import { openDb } from '../lib/db.js';

fs.mkdirSync('data/meta', { recursive: true });
fs.mkdirSync('data/index', { recursive: true });
fs.mkdirSync('data/lookup', { recursive: true });
const db = openDb();
const media = db.prepare('SELECT * FROM media LIMIT 50000').all() as any[];
const people = db.prepare('SELECT * FROM people LIMIT 50000').all() as any[];
const rel = db.prepare('SELECT src,dst,1.0 as weight FROM relations').all() as any[];
const credits = db.prepare('SELECT media_id,person_id,role FROM credits WHERE is_localization=0').all() as any[];

function pointForMedia(m: any) {
  return { id: m.id, x: Math.sin(m.id) * 0.9, y: Math.cos(m.id * 1.3) * 0.9, kind: 0, subtype: m.kind === 'ANIME' ? 0 : 1, clusterId: m.id % 12, sizeHint: Math.max(2, m.popularity / 20) };
}
function pointForPerson(p: any) {
  return { id: p.id, x: Math.sin(p.id * 0.7) * 0.9, y: Math.cos(p.id * 0.2) * 0.9, kind: 1, subtype: p.is_va ? 3 : 2, clusterId: p.id % 12, sizeHint: 2.5 };
}

const points = [...media.map(pointForMedia), ...people.map(pointForPerson)];
fs.writeFileSync('data/points.json', JSON.stringify(points));

const graphMediaStaff = credits.map((c) => ({ src: c.media_id, dst: c.person_id, weight: 1 }));
const collab = db.prepare('SELECT c1.person_id as src, c2.person_id as dst, COUNT(*)*1.0 as weight FROM credits c1 JOIN credits c2 ON c1.media_id=c2.media_id AND c1.person_id<c2.person_id WHERE c1.is_localization=0 AND c2.is_localization=0 GROUP BY 1,2').all() as any[];
fs.writeFileSync('data/graph_media_relations.json', JSON.stringify(rel));
fs.writeFileSync('data/graph_media_staff.json', JSON.stringify(graphMediaStaff));
fs.writeFileSync('data/graph_people_collab.json', JSON.stringify(collab));

const toChunks = (arr: any[], prefix: string, lookupFile: string) => {
  const lookup: Record<string, string> = {};
  for (let i = 0; i < arr.length; i += 500) {
    const chunk = arr.slice(i, i + 500);
    const name = `${prefix}_${String(i / 500).padStart(5, '0')}.json`;
    fs.writeFileSync(`data/meta/${name}`, JSON.stringify(chunk, null, 2));
    for (const row of chunk) lookup[String(row.id)] = name;
  }
  fs.writeFileSync(lookupFile, JSON.stringify(lookup));
};

toChunks(media, 'media', 'data/lookup/media_to_meta_chunk.json');
toChunks(people, 'people', 'data/lookup/people_to_meta_chunk.json');
fs.writeFileSync('data/meta/characters_00000.json', '[]');

const tagToMedia: Record<string, number[]> = {};
media.forEach((m) => JSON.parse(m.tags || '[]').forEach((t: string) => ((tagToMedia[t] ??= []).push(m.id))));
const roleToPeople: Record<string, number[]> = {};
people.forEach((p) => JSON.parse(p.roles || '[]').forEach((r: string) => ((roleToPeople[r] ??= []).push(p.id))));
const year: Record<string, number[]> = {};
media.forEach((m) => ((year[m.year] ??= []).push(m.id)));

fs.writeFileSync('data/index/search.json', JSON.stringify({ media: media.map((m) => ({ id: m.id, title: m.title })), people: people.map((p) => ({ id: p.id, name: p.name })) }));
fs.writeFileSync('data/index/tag_to_media.json', JSON.stringify(tagToMedia));
fs.writeFileSync('data/index/role_to_people.json', JSON.stringify(roleToPeople));
fs.writeFileSync('data/index/tag_role_to_people.json', JSON.stringify({}));
fs.writeFileSync('data/index/year_buckets.json', JSON.stringify(year));
fs.writeFileSync('data/clusters.json', JSON.stringify(Array.from({ length: 12 }, (_, id) => ({ cluster_id: id, label: `Cluster ${id}`, centroid: [Math.sin(id), Math.cos(id)] }))));
fs.writeFileSync('data/manifest.json', JSON.stringify({
  generated_at: new Date().toISOString(),
  git_sha: process.env.GITHUB_SHA || 'local',
  counts: { media: media.length, people: people.length, credits: credits.length, relations: rel.length },
  build_params: { TARGET_ANIME: process.env.TARGET_ANIME || 50000, TARGET_MANGA: process.env.TARGET_MANGA || 50000 },
  format: 'json'
}, null, 2));
console.log('Artifacts built (json mode)');
