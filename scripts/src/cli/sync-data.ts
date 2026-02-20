import fs from 'node:fs';
import path from 'node:path';
import { fromRoot } from '../lib/paths.js';

const src = fromRoot('data');
const dst = fromRoot('app', 'public', 'data');

fs.mkdirSync(dst, { recursive: true });

function copyDir(a: string, b: string) {
  fs.mkdirSync(b, { recursive: true });
  for (const e of fs.readdirSync(a, { withFileTypes: true })) {
    const ap = path.join(a, e.name);
    const bp = path.join(b, e.name);
    if (e.isDirectory()) copyDir(ap, bp);
    else fs.copyFileSync(ap, bp);
  }
}

copyDir(src, dst);
console.log('Synced data/ to app/public/data/');
