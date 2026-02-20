import fs from 'node:fs';

const required = [
  'data/manifest.json',
  'data/points.json',
  'data/graph_media_relations.json',
  'data/graph_media_staff.json',
  'data/graph_people_collab.json',
  'data/index/search.json',
  'data/lookup/media_to_meta_chunk.json',
  'data/lookup/people_to_meta_chunk.json',
  'data/clusters.json'
];

for (const f of required) {
  if (!fs.existsSync(f)) throw new Error(`Missing ${f}`);
}

const manifest = JSON.parse(fs.readFileSync('data/manifest.json', 'utf8'));
if (manifest.counts.media < 1) throw new Error('No media data');
if (manifest.format !== 'json') throw new Error('Unexpected artifact format');
console.log('Sanity checks passed');
