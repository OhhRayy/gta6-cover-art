// The cover engine: draws a GTA-poster-style cover on any 2D canvas, at any size.
// Everything is drawn from the state — no image is ever fetched from the network.
// Photos come from the caller through `resolvePhoto(key)`, which returns an
// HTMLImageElement (a local upload or a bundled sample) or null.

import { GRADES } from './grades.js';
import { LAYOUTS } from './layouts.js';

export const SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

/** Deterministic pseudo-random generator, so the grain looks the same every render. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws one photo into a rectangle, cover-fit, with zoom and pan offsets. */
export function drawPhotoCover(ctx, img, x, y, w, h, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * (zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  ctx.drawImage(img, x + (w - dw) / 2 + (ox || 0) * w, y + (h - dh) / 2 + (oy || 0) * h, dw, dh);
}

/** Draws a five-pointed star path centred at (cx, cy) with outer radius r. */
export function starPath(ctx, cx, cy, r) {
  const inner = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Fits a one-line title into maxWidth, shrinking from startSize. Returns the size. */
export function fitTitle(ctx, text, maxWidth, startSize, fontName) {
  let size = startSize;
  ctx.font = `${size}px ${fontName}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${fontName}`;
  }
  return size;
}

/** Halftone dots along a horizontal strip — the poster's printed-ink look. */
export function drawHalftone(ctx, x, y, w, rows, dotGap, color) {
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let px = x + dotGap / 2; px < x + w; px += dotGap) {
      const rad = dotGap * 0.16 * (1 + 0.6 * Math.sin(px / dotGap + r * 1.7));
      ctx.beginPath();
      ctx.arc(px, y + r * dotGap, Math.max(0.6, rad), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Film grain: faint speckles over the whole cover. */
export function drawGrain(ctx, w, h, seed = 42) {
  const rand = mulberry32(seed);
  const n = Math.floor((w * h) / 900);
  for (let i = 0; i < n; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
}

/** Darkened corners that pull the eye to the middle of the cover. */
export function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Draws one panel: the photo (or a grade-coloured placeholder), its tint and frame. */
export function drawPanel(ctx, panel, slot, img, grade, W, H, diagonal) {
  const x = panel.x * W;
  const y = panel.y * H;
  const w = panel.w * W;
  const h = panel.h * H;
  ctx.save();
  if (diagonal) {
    // Parallelogram clip: the band leans right as it falls.
    const s = H * 0.055;
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + w + s, y);
    ctx.lineTo(x + w - s, y + h);
    ctx.lineTo(x - s, y + h);
    ctx.closePath();
    ctx.clip();
  } else if (panel.rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  }
  // The clip paths above are in absolute cover coordinates, except the rotated
  // one, whose transform already moved the origin to the panel's top-left.
  const ox = panel.rot ? 0 : x;
  const oy = panel.rot ? 0 : y;
  if (img) {
    drawPhotoCover(ctx, img, ox, oy, w, h, slot.zoom, slot.ox, slot.oy);
  } else {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + h);
    g.addColorStop(0, grade.sky[0]);
    g.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, w, h);
  }
  // Grade tint over the photo, then a soft top light.
  ctx.fillStyle = grade.tint;
  ctx.fillRect(ox, oy, w, h);
  const light = ctx.createLinearGradient(ox, oy, ox, oy + h);
  light.addColorStop(0, 'rgba(255,255,255,0.14)');
  light.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.fillStyle = light;
  ctx.fillRect(ox, oy, w, h);
  ctx.restore();

  // Frame: a white inked border around the panel.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.lineJoin = 'round';
  if (diagonal) {
    const s = H * 0.055;
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + w + s, y);
    ctx.lineTo(x + w - s, y + h);
    ctx.lineTo(x - s, y + h);
    ctx.closePath();
    ctx.stroke();
  } else if (panel.rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
  } else {
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}

/** Draws the title block: gradient band, halftone strip, big title, script subtitle. */
export function drawTitleBlock(ctx, box, state, grade, W, H) {
  const x = box.x * W;
  const y = box.y * H;
  const w = box.w * W;
  const h = box.h * H;
  const inGrid = !!state.layoutDef.titleInGrid;

  const g = ctx.createLinearGradient(x, y, x + w, y + (inGrid ? h : 0));
  if (inGrid) {
    g.addColorStop(0, grade.band[1]);
    g.addColorStop(1, grade.band[0]);
  } else {
    g.addColorStop(0, grade.band[0]);
    g.addColorStop(1, grade.band[1]);
  }
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  if (!inGrid) {
    drawHalftone(ctx, x, y + h * 0.06, w, 2, Math.max(9, W * 0.012), 'rgba(255,255,255,0.35)');
  }
  // Thin accent rule under the halftone.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(x, y + (inGrid ? 0 : h * 0.16), w, Math.max(2, H * 0.004));

  const title = (state.title || 'VICE CITY').toUpperCase();
  const pad = w * 0.05;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (inGrid) {
    // Centre-cell title: stacked words in their own order, sized to the longest.
    const words = title.split(/\s+/);
    const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), '');
    const size = fitTitle(ctx, longest, w - pad * 2, h * 0.30, 'Anton, sans-serif');
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.fillStyle = grade.title;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.04;
    const lineH = size * 1.08;
    const startY = y + h / 2 - ((words.length - 1) * lineH) / 2;
    words.forEach((word, i) => ctx.fillText(word, x + w / 2, startY + i * lineH));
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    return;
  }

  const titleSize = fitTitle(ctx, title, w - pad * 2, h * 0.46, 'Anton, sans-serif');
  const titleY = y + h * 0.44;
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.lineWidth = Math.max(2, titleSize * 0.07);
  ctx.strokeStyle = 'rgba(20,5,30,0.65)';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = titleSize * 0.14;
  ctx.shadowOffsetY = titleSize * 0.05;
  ctx.strokeText(title, x + w / 2, titleY);
  ctx.fillStyle = grade.title;
  ctx.fillText(title, x + w / 2, titleY);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(12, h * 0.17);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.sub;
    ctx.fillText(sub, x + w / 2, y + h * 0.82);
  }
}

/** Draws the star heat meter (top-left) and the badge ribbon (top-right). */
export function drawOverlays(ctx, state, grade, W, H) {
  const stars = Math.max(0, Math.min(5, state.stars || 0));
  if (stars > 0) {
    const r = Math.max(10, W * 0.016);
    const gap = r * 2.4;
    const totalW = gap * 5;
    const cx0 = W * 0.03 + r;
    const cy = H * 0.035 + r;
    ctx.fillStyle = 'rgba(10,5,20,0.55)';
    const pillH = r * 2.6;
    ctx.beginPath();
    ctx.roundRect(W * 0.02, H * 0.02, totalW + r * 1.2, pillH, pillH / 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      starPath(ctx, cx0 + i * gap, cy, r);
      ctx.fillStyle = i < stars ? grade.accent : 'rgba(255,255,255,0.28)';
      ctx.fill();
    }
  }
  const badge = (state.badge || '').trim();
  if (badge) {
    const fs = Math.max(12, W * 0.02);
    ctx.font = `${fs}px "Bebas Neue", sans-serif`;
    const tw = ctx.measureText(badge.toUpperCase()).width;
    const bw = tw + fs * 1.6;
    const bh = fs * 1.9;
    ctx.save();
    ctx.translate(W - bw * 0.55, H * 0.055);
    ctx.rotate(0.10);
    ctx.fillStyle = grade.accent;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh * 0.18);
    ctx.fill();
    ctx.fillStyle = '#1d0b2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge.toUpperCase(), 0, bh * 0.04);
    ctx.restore();
  }
}

/**
 * Draws the whole cover on `ctx` at W x H.
 * `state`: { layout, layoutDef, grade, gradeDef, title, subtitle, badge, stars,
 *   grain, vignette, panels: [{key, zoom, ox, oy}] }
 * `resolvePhoto(key)`: image element or null.
 */
export function drawCover(ctx, state, W, H, resolvePhoto) {
  const grade = state.gradeDef;
  const layout = state.layoutDef;
  ctx.clearRect(0, 0, W, H);

  // Sky backdrop: the grade's sunset gradient fills every gap.
  const sky = ctx.createLinearGradient(0, 0, W * 0.4, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  layout.panels.forEach((panel, i) => {
    const slot = state.panels[i] || { key: null, zoom: 1, ox: 0, oy: 0 };
    const img = slot.key ? resolvePhoto(slot.key) : null;
    drawPanel(ctx, panel, slot, img, grade, W, H, !!layout.diagonal);
  });

  drawTitleBlock(ctx, layout.title, state, grade, W, H);
  drawOverlays(ctx, state, grade, W, H);
  if (state.vignette !== false) drawVignette(ctx, W, H);
  if (state.grain !== false) drawGrain(ctx, W, H);
}

/** Renders the cover onto a fresh canvas at the requested size. */
export function renderCoverCanvas(state, size, resolvePhoto) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), state, size.w, size.h, resolvePhoto);
  return canvas;
}
