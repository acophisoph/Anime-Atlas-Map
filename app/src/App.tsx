import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Application, Graphics } from 'pixi.js';
import { STRINGS } from './i18n/strings';
import { loadNodeMeta, loadPoints, type NodeMeta } from './lib';
import type { AtlasPoint } from './types';

export function App() {
  const [lang, setLang] = useState<'en' | 'jp'>('en');
  const [points, setPoints] = useState<AtlasPoint[]>([]);
  const [mode, setMode] = useState<'media' | 'people'>('media');
  const [selected, setSelected] = useState<AtlasPoint | null>(null);
  const [detail, setDetail] = useState<NodeMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPoints()
      .then(setPoints)
      .catch((e) => setError(`Failed to load data: ${String(e)}`));
  }, []);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    loadNodeMeta(selected)
      .then(setDetail)
      .catch((e) => setError(`Failed to load details: ${String(e)}`));
  }, [selected]);

  useEffect(() => {
    if (!mountRef.current || points.length === 0) return;
    const app = new Application();
    const width = Math.max(320, window.innerWidth - 280);
    const height = Math.max(280, window.innerHeight - 48);

    app
      .init({ width, height, background: '#0b1020', antialias: true })
      .then(() => {
        mountRef.current!.innerHTML = '';
        mountRef.current!.appendChild(app.canvas);
        const filtered = points.filter((p) => (mode === 'media' ? p.kind === 0 : p.kind === 1));
        for (const p of filtered) {
          const g = new Graphics();
          g.circle((p.x + 1) * 0.5 * (app.screen.width - 20) + 10, (p.y + 1) * 0.5 * (app.screen.height - 20) + 10, Math.max(1.5, p.sizeHint * 0.25));
          g.fill({ color: p.kind === 0 ? 0x70b7ff : 0xff9f6e, alpha: 0.9 });
          g.eventMode = 'static';
          g.on('pointertap', () => setSelected(p));
          app.stage.addChild(g);
        }
      })
      .catch((e) => setError(`Rendering failed: ${String(e)}`));

    return () => app.destroy(true, { children: true });
  }, [points, mode]);

  const t = useMemo(() => STRINGS[lang], [lang]);

  return (
    <div>
      <header className="top">
        <b>{t.title}</b>
        <div>
          <button onClick={() => setLang(lang === 'en' ? 'jp' : 'en')}>{lang.toUpperCase()}</button>
          <button onClick={() => setMode('media')}>{t.media}</button>
          <button onClick={() => setMode('people')}>{t.people}</button>
        </div>
      </header>
      <main className="main">
        <div ref={mountRef} className="canvas" />
        <aside className="drawer">
          <h3>{selected ? `#${selected.id}` : 'Select a node'}</h3>
          <p>{t.search} / {t.similar}</p>
          <p>{t.talent}</p>
          <p>Mode: {mode}</p>
          {detail && 'title' in detail ? (
            <div>
              <p><b>{detail.title}</b> ({detail.kind})</p>
              <p>Year: {detail.year ?? '-'}</p>
              <p>Score: {detail.score ?? '-'}</p>
              <p>Genres: {(detail.genres ?? []).join(', ') || '-'}</p>
              <p>Tags: {(detail.tags ?? []).join(', ') || '-'}</p>
              <p>Studios: {(detail.studios ?? []).join(', ') || '-'}</p>
            </div>
          ) : null}
          {detail && 'name' in detail ? (
            <div>
              <p><b>{detail.name}</b></p>
              <p>Roles: {(detail.roles ?? []).join(', ') || '-'}</p>
              <p>VA: {detail.is_va ? 'Yes' : 'No'}</p>
              <p>Genres: {(detail.genres ?? []).join(', ') || '-'}</p>
              <p>Tags: {(detail.tags ?? []).join(', ') || '-'}</p>
              <p>Studios: {(detail.studios ?? []).join(', ') || '-'}</p>
            </div>
          ) : null}
          {error ? <p style={{ color: '#ff9f9f' }}>{error}</p> : null}
          {!error && points.length === 0 ? <p>Loading points...</p> : null}
        </aside>
      </main>
    </div>
  );
}
