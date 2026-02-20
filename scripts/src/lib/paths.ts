import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, '../../..');

export function fromRoot(...parts: string[]) {
  return path.join(repoRoot, ...parts);
}
