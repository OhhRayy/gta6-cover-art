// Fixed scenes for screenshots. `?shot=editor` shows the editor with photos
// loaded; `?shot=cover` shows the cover alone, edge to edge. The query string
// picks the scene: layout, grade, size (square|portrait|wide), title,
// subtitle, badge, stars, and photos (comma-separated sample names).
// window.__shotReady is set once the scene has painted.

import { loadFonts } from './fonts.js';
import { panelsFor, preloadSamples } from './state.js';
import { LAYOUTS } from './layouts.js';

const SHOT_SAMPLES = ['convertible', 'rooftop', 'neon', 'pier'];

/** Photo keys for a scene: named samples in order, cycling to fill `count`. */
function photoKeys(query, count) {
  const named = (query.get('photos') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const pool = named.length ? named : SHOT_SAMPLES;
  const keys = [];
  for (let i = 0; i < count; i++) keys.push(`sample:${pool[i % pool.length]}`);
  return keys;
}

export async function runShot(shot, query) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layoutId = LAYOUTS[query.get('layout')] ? query.get('layout') : 'bands';
  const keys = photoKeys(query, LAYOUTS[layoutId].count);
  const panels = panelsFor(layoutId, keys[0]);
  keys.forEach((key, i) => { panels[i].key = key; });
  const patch = {
    layout: layoutId,
    grade: query.get('grade') || 'sunset',
    size: query.get('size') || 'wide',
    title: query.get('title') || 'VICE CITY',
    subtitle: query.get('subtitle') || 'Leon & Lucia',
    badge: query.get('badge') || 'WANTED',
    stars: Number(query.get('stars') ?? 5),
    panels,
  };
  await Promise.all([loadFonts(), preloadSamples()]);
  window.__setShotState(patch);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
