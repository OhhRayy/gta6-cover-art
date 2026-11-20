// Editor state for Vice Cover Studio: what the cover is, what the user can
// undo, and where the photos live. Photos sit in a Map keyed by a string, so
// the undo stack only ever holds small JSON snapshots, never image bytes.

import { GRADES, GRADE_IDS } from './grades.js';
import { LAYOUTS, LAYOUT_IDS } from './layouts.js';
import { SIZES } from './cover.js';

// The six bundled sample photos (AI-made, no real people).
export const SAMPLE_PHOTOS = [
  { key: 'sample:convertible', label: 'Convertible', src: 'samples/convertible.jpg' },
  { key: 'sample:rooftop', label: 'Rooftop', src: 'samples/rooftop.jpg' },
  { key: 'sample:neon', label: 'Neon Street', src: 'samples/neon.jpg' },
  { key: 'sample:pier', label: 'Pier', src: 'samples/pier.jpg' },
  { key: 'sample:woman', label: 'Woman (Convertible)', src: 'samples/woman.jpg' },
  { key: 'sample:man', label: 'Man (Rooftop)', src: 'samples/man.jpg' },
];

// The cover a fresh visitor sees: diagonal bands, sunset grade, wide export.
export const DEFAULT_STATE = {
  layout: 'bands',
  grade: 'sunset',
  size: 'wide',
  title: 'VICE CITY',
  subtitle: 'Leon & Lucia',
  badge: 'WANTED',
  stars: 5,
  grain: true,
  vignette: true,
  panels: [
    { key: 'sample:convertible', zoom: 1, ox: 0, oy: 0 },
    { key: 'sample:rooftop', zoom: 1, ox: 0, oy: 0 },
    { key: 'sample:neon', zoom: 1, ox: 0, oy: 0 },
  ],
};

/** The live photo cache: key -> HTMLImageElement. */
export const photoStore = new Map();

/** Loads an image from a URL and caches it under `key`. Resolves to the image. */
export function cachePhoto(key, url) {
  const cached = photoStore.get(key);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      photoStore.set(key, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Preloads the six bundled sample photos. */
export function preloadSamples() {
  const jobs = SAMPLE_PHOTOS.map((sample) => cachePhoto(sample.key, sample.src));
  return Promise.all(jobs);
}

/** A fresh panels array for a layout: first photo spread over every panel. */
export function panelsFor(layoutId, firstKey) {
  const count = LAYOUTS[layoutId].count;
  const slots = [];
  for (let i = 0; i < count; i++) slots.push({ key: firstKey, zoom: 1, ox: 0, oy: 0 });
  return slots;
}

/** The state the renderer needs, with layout and grade objects resolved. */
export function viewState(state) {
  return {
    ...state,
    layoutDef: LAYOUTS[state.layout] || LAYOUTS.bands,
    gradeDef: GRADES[state.grade] || GRADES.sunset,
  };
}

/** The export size object for the state's chosen size id. */
export function sizeOf(state) {
  const found = SIZES.find((size) => size.id === state.size);
  return found || SIZES[0];
}

/** A deep copy of a state object, via JSON. */
export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Undo/redo history over JSON snapshots. `onChange` runs after every undo,
 * redo or push so the preview can repaint.
 */
export class History {
  constructor(initial, onChange) {
    this.past = [];
    this.future = [];
    this.current = cloneState(initial);
    this.onChange = onChange;
  }

  get state() {
    return this.current;
  }

  /** Records a new state, clearing the redo stack. */
  push(next) {
    this.past.push(this.current);
    while (this.past.length > 60) this.past.shift();
    this.future = [];
    this.current = cloneState(next);
    this.onChange(this.current);
  }

  /** Edits the current state in place through `fn`, then records it. */
  edit(fn) {
    const next = cloneState(this.current);
    fn(next);
    this.push(next);
  }

  undo() {
    if (this.past.length === 0) return false;
    this.future.push(this.current);
    this.current = this.past.pop();
    this.onChange(this.current);
    return true;
  }

  redo() {
    if (this.future.length === 0) return false;
    this.past.push(this.current);
    this.current = this.future.pop();
    this.onChange(this.current);
    return true;
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}

export { LAYOUT_IDS, GRADE_IDS };
