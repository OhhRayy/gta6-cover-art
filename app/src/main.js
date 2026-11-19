// Wires the Vice Cover Studio editor: pick a layout, a grade and a size, drop in
// photos, crop each panel by dragging it, letter the caption, export the PNG.
// Photos never leave the machine: uploads are read with object URLs, samples are
// bundled files. A `?shot=` query sets up a fixed scene for a screenshot instead.

import { drawCover, renderCoverCanvas, SIZES } from './cover.js';
import { GRADES, GRADE_IDS } from './grades.js';
import { LAYOUTS, LAYOUT_IDS } from './layouts.js';
import {
  DEFAULT_STATE, SAMPLE_PHOTOS, History, cachePhoto, cloneState,
  panelsFor, photoStore, preloadSamples, sizeOf, viewState,
} from './state.js';
import { runShot } from './shots.js';
import { loadFonts } from './fonts.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');

const fontsReady = loadFonts();

let selectedPanel = 0;
let uploadCounter = 0;

const history = new History(DEFAULT_STATE, () => {
  syncControls();
  redraw();
});

/** Paints the live preview at up to 960 px on its long side. */
function redraw() {
  const state = history.state;
  const size = sizeOf(state);
  const scale = Math.min(1, 960 / Math.max(size.w, size.h));
  const pw = Math.round(size.w * scale);
  const ph = Math.round(size.h * scale);
  if (preview.width !== pw || preview.height !== ph) {
    preview.width = pw;
    preview.height = ph;
  }
  drawCover(preview.getContext('2d'), viewState(state), pw, ph, (key) => photoStore.get(key) || null);
  $('undo').disabled = !history.canUndo;
  $('redo').disabled = !history.canRedo;
}

/** Builds one row of picker buttons into a container. */
function buildPicker(containerId, ids, labels, current, onPick) {
  const box = $(containerId);
  box.innerHTML = '';
  ids.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (id === current ? ' active' : '');
    b.textContent = labels(id);
    b.setAttribute('aria-pressed', id === current ? 'true' : 'false');
    b.addEventListener('click', () => onPick(id));
    box.appendChild(b);
  });
}

/** Rebuilds the per-panel editors (photo, zoom, pan) for the current layout. */
function buildPanelEditors() {
  const state = history.state;
  const box = $('panels');
  box.innerHTML = '';
  const count = (LAYOUTS[state.layout] || LAYOUTS.bands).count;
  for (let i = 0; i < count; i++) {
    const slot = state.panels[i] || { key: null, zoom: 1, ox: 0, oy: 0 };
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === selectedPanel ? ' selected' : '');
    row.innerHTML = `
      <button type="button" class="panel-name">Panel ${i + 1}</button>
      <label>Photo
        <select data-field="key">
          <option value="">— empty —</option>
          ${SAMPLE_PHOTOS.map((s) => `<option value="${s.key}" ${slot.key === s.key ? 'selected' : ''}>${s.label}</option>`).join('')}
          ${slot.key && slot.key.startsWith('upload:') ? `<option value="${slot.key}" selected>Uploaded photo</option>` : ''}
        </select>
        <span class="upload-link" role="button" tabindex="0">Upload…</span>
      </label>
      <label>Zoom <input type="range" data-field="zoom" min="1" max="2.5" step="0.05" value="${slot.zoom || 1}"></label>
      <label>Pan X <input type="range" data-field="ox" min="-0.4" max="0.4" step="0.01" value="${slot.ox || 0}"></label>
      <label>Pan Y <input type="range" data-field="oy" min="-0.4" max="0.4" step="0.01" value="${slot.oy || 0}"></label>
      <button type="button" class="fill-all">Use for all panels</button>`;
    row.querySelector('.panel-name').addEventListener('click', () => {
      selectedPanel = i;
      buildPanelEditors();
      redraw();
    });
    row.querySelector('[data-field="key"]').addEventListener('change', (e) => {
      history.edit((s) => { s.panels[i].key = e.target.value || null; });
    });
    row.querySelector('.upload-link').addEventListener('click', () => {
      selectedPanel = i;
      $('file').click();
    });
    ['zoom', 'ox', 'oy'].forEach((field) => {
      row.querySelector(`[data-field="${field}"]`).addEventListener('input', (e) => {
        history.edit((s) => { s.panels[i][field] = Number(e.target.value); });
      });
    });
    row.querySelector('.fill-all').addEventListener('click', () => {
      const key = history.state.panels[i].key;
      history.edit((s) => { s.panels.forEach((p) => { p.key = key; }); });
      statusEl.textContent = key ? 'One photo fills every panel.' : 'Every panel cleared.';
    });
    box.appendChild(row);
  }
}

/** Syncs every control with the current state (after undo, redo or a shot). */
function syncControls() {
  const state = history.state;
  buildPicker('layouts', LAYOUT_IDS, (id) => LAYOUTS[id].name, state.layout, (id) => {
    history.edit((s) => {
      s.layout = id;
      const firstKey = s.panels[0] ? s.panels[0].key : null;
      s.panels = panelsFor(id, firstKey);
    });
    selectedPanel = 0;
  });
  buildPicker('grades', GRADE_IDS, (id) => GRADES[id].name, state.grade, (id) => {
    history.edit((s) => { s.grade = id; });
  });
  buildPicker('sizes', SIZES.map((s) => s.id), (id) => SIZES.find((s) => s.id === id).label, state.size, (id) => {
    history.edit((s) => { s.size = id; });
  });
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('badge').value = state.badge;
  $('stars').value = String(state.stars);
  $('grain').checked = state.grain !== false;
  $('vignette').checked = state.vignette !== false;
  buildPanelEditors();
}

$('title').addEventListener('input', (e) => history.edit((s) => { s.title = e.target.value; }));
$('subtitle').addEventListener('input', (e) => history.edit((s) => { s.subtitle = e.target.value; }));
$('badge').addEventListener('input', (e) => history.edit((s) => { s.badge = e.target.value; }));
$('stars').addEventListener('change', (e) => history.edit((s) => { s.stars = Number(e.target.value); }));
$('grain').addEventListener('change', (e) => history.edit((s) => { s.grain = e.target.checked; }));
$('vignette').addEventListener('change', (e) => history.edit((s) => { s.vignette = e.target.checked; }));
$('undo').addEventListener('click', () => history.undo());
$('redo').addEventListener('click', () => history.redo());
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) history.redo();
    else history.undo();
  }
});

$('file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const key = `upload:${Date.now()}-${uploadCounter++}`;
  await cachePhoto(key, URL.createObjectURL(file));
  const i = selectedPanel;
  history.edit((s) => { s.panels[i].key = key; });
  statusEl.textContent = 'Photo loaded into panel ' + (i + 1) + '.';
});

$('export').addEventListener('click', async () => {
  await fontsReady;
  const state = history.state;
  const size = sizeOf(state);
  const canvas = renderCoverCanvas(viewState(state), size, (key) => photoStore.get(key) || null);
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
});

/** Drag on the preview to pan the photo in the panel under the pointer. */
let drag = null;
function panelAt(px, py) {
  const state = history.state;
  const layout = LAYOUTS[state.layout];
  const size = sizeOf(state);
  const fx = (px / preview.width) * size.w;
  const fy = (py / preview.height) * size.h;
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (fx >= p.x * size.w && fx <= (p.x + p.w) * size.w && fy >= p.y * size.h && fy <= (p.y + p.h) * size.h) return i;
  }
  return -1;
}
preview.addEventListener('pointerdown', (e) => {
  const r = preview.getBoundingClientRect();
  const i = panelAt(e.clientX - r.left, e.clientY - r.top);
  if (i < 0) return;
  selectedPanel = i;
  buildPanelEditors();
  drag = { i, x: e.clientX, y: e.clientY };
  preview.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = preview.getBoundingClientRect();
  const size = sizeOf(history.state);
  const dx = ((e.clientX - drag.x) / r.width) * size.w;
  const dy = ((e.clientY - drag.y) / r.height) * size.h;
  const layout = LAYOUTS[history.state.layout];
  const p = layout.panels[drag.i];
  const slot = history.state.panels[drag.i];
  const nx = Math.max(-0.4, Math.min(0.4, (slot.ox || 0) + dx / (p.w * size.w)));
  const ny = Math.max(-0.4, Math.min(0.4, (slot.oy || 0) + dy / (p.h * size.h)));
  const next = cloneState(history.state);
  next.panels[drag.i].ox = nx;
  next.panels[drag.i].oy = ny;
  history.push(next);
  drag.x = e.clientX;
  drag.y = e.clientY;
});
preview.addEventListener('pointerup', () => { drag = null; });

/** Screenshot hooks: the real export bytes at any size, for the makers' shots. */
window.__exportCoverDataURL = async (w, h) => {
  await fontsReady;
  const canvas = renderCoverCanvas(viewState(history.state), { w, h }, (key) => photoStore.get(key) || null);
  return canvas.toDataURL('image/png');
};
window.__setShotState = (patch) => {
  history.push({ ...cloneState(history.state), ...patch });
};

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search));
} else {
  preloadSamples().then(() => fontsReady.then(redraw));
  syncControls();
  redraw();
}
