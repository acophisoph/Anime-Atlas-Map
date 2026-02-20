import type { AtlasPoint } from './types';

export async function loadPoints(): Promise<AtlasPoint[]> {
  const res = await fetch('./data/points.json');
  if (!res.ok) throw new Error('Failed to load points.json');
  return (await res.json()) as AtlasPoint[];
}
