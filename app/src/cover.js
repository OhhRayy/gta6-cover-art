// The cover engine: draws a GTA-poster-style cover on any 2D canvas, at any
// size. Everything is drawn from the state — no image is ever fetched from the
// network. Photos arrive through `resolvePhoto(key)`, which hands back an
// HTMLImageElement (a local upload or a bundled sample) or null.

import { GRADES } from './grades.js';
import { LAYOUTS } from './layouts.js';

// The three export sizes the editor offers, in pixels.
export const SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

/** Seeded pseudo-random generator, so the grain looks the same every render. */
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
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  const scale = Math.max(w / imgW, h / imgH) * (zoom || 1);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = x + (w - drawW) / 2 + (ox || 0) * w;
  const drawY = y + (h - drawH) / 2 + (oy || 0) * h;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

/** Traces a five-pointed star path centred at (cx, cy), outer radius r. */
export function starPath(ctx, cx, cy, r) {
  const innerR = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : innerR;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Shrinks a one-line title from startSize until it fits maxWidth. Returns the size. */
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
  for (let row = 0; row < rows; row++) {
    for (let px = x + dotGap / 2; px < x + w; px += dotGap) {
      const radius = dotGap * 0.16 * (1 + 0.6 * Math.sin(px / dotGap + row * 1.7));
      ctx.beginPath();
      ctx.arc(px, y + row * dotGap, Math.max(0.6, radius), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Film grain: faint speckles scattered over the whole cover. */
export function drawGrain(ctx, w, h, seed = 42) {
  const rand = mulberry32(seed);
  const specks = Math.floor((w * h) / 900);
  for (let i = 0; i < specks; i++) {
    const light = rand() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
}

/** Darkened corners that pull the eye to the middle of the cover. */
export function drawVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** The parallelogram path of a diagonal band panel, in cover coordinates. */
function bandPath(ctx, x, y, w, h, lean) {
  ctx.beginPath();
  ctx.moveTo(x + lean, y);
  ctx.lineTo(x + w + lean, y);
  ctx.lineTo(x + w - lean, y + h);
  ctx.lineTo(x - lean, y + h);
  ctx.closePath();
}

/** Strokes the white inked frame around a panel. */
function strokePanelFrame(ctx, panel, x, y, w, h, W, H, diagonal) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.lineJoin = 'round';
  if (diagonal) {
    bandPath(ctx, x, y, w, h, H * 0.055);
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

/** Draws one panel: the photo (or a grade-coloured placeholder), tint and frame. */
export function drawPanel(ctx, panel, slot, img, grade, W, H, diagonal) {
  const x = panel.x * W;
  const y = panel.y * H;
  const w = panel.w * W;
  const h = panel.h * H;
  ctx.save();
  if (diagonal) {
    bandPath(ctx, x, y, w, h, H * 0.055);
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
  // Clip paths above are in absolute cover coordinates, except the rotated
  // one, whose transform already moved the origin to the panel's top-left.
  const ox = panel.rot ? 0 : x;
  const oy = panel.rot ? 0 : y;
  if (img) {
    drawPhotoCover(ctx, img, ox, oy, w, h, slot.zoom, slot.ox, slot.oy);
  } else {
    const fill = ctx.createLinearGradient(ox, oy, ox, oy + h);
    fill.addColorStop(0, grade.sky[0]);
    fill.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = fill;
    ctx.fillRect(ox, oy, w, h);
  }
  // Grade tint over the photo, then a soft light from the top.
  ctx.fillStyle = grade.tint;
  ctx.fillRect(ox, oy, w, h);
  const light = ctx.createLinearGradient(ox, oy, ox, oy + h);
  light.addColorStop(0, 'rgba(255,255,255,0.14)');
  light.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.fillStyle = light;
  ctx.fillRect(ox, oy, w, h);
  ctx.restore();

  strokePanelFrame(ctx, panel, x, y, w, h, W, H, diagonal);
}

/** Draws the title block: gradient band, halftone strip, big title, script subtitle. */
export function drawTitleBlock(ctx, box, state, grade, W, H) {
  const x = box.x * W;
  const y = box.y * H;
  const w = box.w * W;
  const h = box.h * H;
  const inGrid = !!state.layoutDef.titleInGrid;

  const band = ctx.createLinearGradient(x, y, x + w, y + (inGrid ? h : 0));
  if (inGrid) {
    band.addColorStop(0, grade.band[1]);
    band.addColorStop(1, grade.band[0]);
  } else {
    band.addColorStop(0, grade.band[0]);
    band.addColorStop(1, grade.band[1]);
  }
  ctx.fillStyle = band;
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
    // Centre-cell title: words stacked in their own order, sized to the longest.
    const words = title.split(/\s+/);
    const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), '');
    const size = fitTitle(ctx, longest, w - pad * 2, h * 0.30, 'Anton, sans-serif');
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.fillStyle = grade.title;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.04;
    const lineH = size * 1.08;
    const firstY = y + h / 2 - ((words.length - 1) * lineH) / 2;
    words.forEach((word, i) => ctx.fillText(word, x + w / 2, firstY + i * lineH));
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
  const pop = grade.pop || grade.accent;
  if (stars > 0) {
    const r = Math.max(10, W * 0.016);
    const gap = r * 2.4;
    const pillW = gap * 5 + r * 1.2;
    const cx0 = W * 0.03 + r;
    const cy = H * 0.035 + r;
    const pillH = r * 2.6;
    ctx.fillStyle = 'rgba(10,5,20,0.55)';
    ctx.beginPath();
    ctx.roundRect(W * 0.02, H * 0.02, pillW, pillH, pillH / 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      starPath(ctx, cx0 + i * gap, cy, r);
      ctx.fillStyle = i < stars ? pop : 'rgba(255,255,255,0.28)';
      ctx.fill();
    }
  }
  const badge = (state.badge || '').trim();
  if (badge) {
    const fs = Math.max(12, W * 0.02);
    ctx.font = `${fs}px "Bebas Neue", sans-serif`;
    const textW = ctx.measureText(badge.toUpperCase()).width;
    const bw = textW + fs * 1.6;
    const bh = fs * 1.9;
    ctx.save();
    ctx.translate(W - bw * 0.55, H * 0.055);
    ctx.rotate(0.10);
    ctx.fillStyle = pop;
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
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, size.w, size.h, resolvePhoto);
  return canvas;
}
