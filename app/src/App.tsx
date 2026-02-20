import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Application, Graphics } from 'pixi.js';
import { STRINGS } from './i18n/strings';
import { loadPoints } from './lib';
import type { AtlasPoint } from './types';

export function App() {
  const [lang, setLang] = useState<'en'|'jp'>('en');
  const [points, setPoints] = useState<AtlasPoint[]>([]);
  const [mode, setMode] = useState<'media'|'people'>('media');
  const [selected, setSelected] = useState<AtlasPoint | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadPoints().then(setPoints); }, []);
  useEffect(() => {
    if (!mountRef.current) return;
    const app = new Application();
    app.init({ width: window.innerWidth - 280, height: window.innerHeight - 48, background: '#0b1020', antialias: true }).then(() => {
      mountRef.current!.innerHTML = '';
      mountRef.current!.appendChild(app.canvas);
      const filtered = points.filter(p => mode === 'media' ? p.kind === 0 : p.kind === 1);
      for (const p of filtered) {
        const g = new Graphics();
        g.circle((p.x+1)*0.5*(app.screen.width-20)+10, (p.y+1)*0.5*(app.screen.height-20)+10, Math.max(1.5, p.sizeHint*0.25));
        g.fill({ color: p.kind === 0 ? 0x70b7ff : 0xff9f6e, alpha: 0.9 });
        g.eventMode = 'static';
        g.on('pointertap', () => setSelected(p));
        app.stage.addChild(g);
      }
    });
    return () => app.destroy(true, { children: true });
  }, [points, mode]);

  const t = useMemo(() => STRINGS[lang], [lang]);

  return <div>
    <header className='top'><b>{t.title}</b><div>
      <button onClick={() => setLang(lang === 'en' ? 'jp' : 'en')}>{lang.toUpperCase()}</button>
      <button onClick={() => setMode('media')}>{t.media}</button>
      <button onClick={() => setMode('people')}>{t.people}</button>
    </div></header>
    <main className='main'><div ref={mountRef} className='canvas'/><aside className='drawer'>
      <h3>{selected ? `#${selected.id}` : 'Select a node'}</h3>
      <p>{t.search} / {t.similar}</p>
      <p>{t.talent}</p>
      <p>Mode: {mode}</p>
    </aside></main>
  </div>;
}
