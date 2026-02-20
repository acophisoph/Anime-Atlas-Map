import type { AtlasPoint } from './types';

type MediaMeta = {
  id: number;
  kind: string;
  title: string;
  year?: number;
  score?: number;
  tags?: string[];
  genres?: string[];
  studios?: string[];
  popularity?: number;
};

type PersonMeta = {
  id: number;
  name: string;
  roles?: string[];
  tags?: string[];
  genres?: string[];
  studios?: string[];
  is_va?: number;
};

export type NodeMeta = MediaMeta | PersonMeta;

let mediaLookupCache: Record<string, string> | null = null;
let peopleLookupCache: Record<string, string> | null = null;
const chunkCache = new Map<string, any[]>();

export async function loadPoints(): Promise<AtlasPoint[]> {
  const res = await fetch('./data/points.json');
  if (!res.ok) throw new Error('Failed to load points.json');
  return (await res.json()) as AtlasPoint[];
}

async function loadLookup(kind: 'media' | 'people'): Promise<Record<string, string>> {
  if (kind === 'media' && mediaLookupCache) return mediaLookupCache;
  if (kind === 'people' && peopleLookupCache) return peopleLookupCache;
  const filename = kind === 'media' ? 'media_to_meta_chunk.json' : 'people_to_meta_chunk.json';
  const res = await fetch(`./data/lookup/${filename}`);
  if (!res.ok) throw new Error(`Failed to load lookup: ${filename}`);
  const data = (await res.json()) as Record<string, string>;
  if (kind === 'media') mediaLookupCache = data;
  else peopleLookupCache = data;
  return data;
}

async function loadChunk(filename: string): Promise<any[]> {
  if (chunkCache.has(filename)) return chunkCache.get(filename)!;
  const res = await fetch(`./data/meta/${filename}`);
  if (!res.ok) throw new Error(`Failed to load metadata chunk: ${filename}`);
  const chunk = (await res.json()) as any[];
  chunkCache.set(filename, chunk);
  return chunk;
}

export async function loadNodeMeta(point: AtlasPoint): Promise<NodeMeta | null> {
  const kind = point.kind === 0 ? 'media' : 'people';
  const lookup = await loadLookup(kind);
  const filename = lookup[String(point.id)];
  if (!filename) return null;
  const chunk = await loadChunk(filename);
  return (chunk.find((row) => Number(row.id) === point.id) as NodeMeta | undefined) ?? null;
}
