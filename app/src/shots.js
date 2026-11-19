// Fixed scenes for screenshots: ?shot=editor shows the editor with photos loaded;
// ?shot=cover shows the cover alone, edge to edge. Query params pick the scene:
// layout, grade, size (square|portrait|wide), title, subtitle, badge, stars and
// photos (comma-separated sample names). window.__shotReady is set once painted.

import { loadFonts } from './fonts.js';
import { panelsFor, preloadSamples } from './state.js';
import { LAYOUTS } from './layouts.js';

const SAMPLE_KEYS = ['convertible', 'rooftop', 'neon', 'pier'];

function photoKeys(query, count) {
  const named = (query.get('photos') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const names = named.length ? named : SAMPLE_KEYS;
  return Array.from({ length: count }, (_, i) => `sample:${names[i % names.length]}`);
}

export async function runShot(shot, query) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = LAYOUTS[query.get('layout')] ? query.get('layout') : 'bands';
  const count = LAYOUTS[layout].count;
  const keys = photoKeys(query, count);
  const panels = panelsFor(layout, keys[0]);
  keys.forEach((key, i) => { panels[i].key = key; });
  const patch = {
    layout,
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
