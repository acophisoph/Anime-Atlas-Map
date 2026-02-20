import fs from 'node:fs';
import { fromRoot } from '../lib/paths.js';

const required = [
  fromRoot('data', 'manifest.json'),
  fromRoot('data', 'points.json'),
  fromRoot('data', 'graph_media_relations.json'),
  fromRoot('data', 'graph_media_staff.json'),
  fromRoot('data', 'graph_people_collab.json'),
  fromRoot('data', 'index', 'search.json'),
  fromRoot('data', 'lookup', 'media_to_meta_chunk.json'),
  fromRoot('data', 'lookup', 'people_to_meta_chunk.json'),
  fromRoot('data', 'clusters.json')
];

for (const f of required) {
  if (!fs.existsSync(f)) throw new Error(`Missing ${f}`);
}

const manifest = JSON.parse(fs.readFileSync(fromRoot('data', 'manifest.json'), 'utf8'));
if (manifest.counts.media < 1) throw new Error('No media data');
if (manifest.format !== 'json') throw new Error('Unexpected artifact format');
console.log('Sanity checks passed');
