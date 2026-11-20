// Panel layouts for Vice Cover Studio. A layout describes the panels that
// build the cover — each as fractions of the cover's width and height — plus
// the box the title block sits in. A panel is {x, y, w, h, rot} with rot in
// degrees; `title` is {x, y, w, h} in fractions. `count` says how many photos
// a layout takes, and `titleInGrid` marks the layout whose centre cell is
// the title instead of a photo.

// Builds one panel rectangle; `rot` tilts it, `kind` marks a diagonal band.
function rect(x, y, w, h, rot = 0, kind = undefined) {
  const panel = { x, y, w, h, rot };
  if (kind) panel.kind = kind;
  return panel;
}

export const LAYOUTS = {
  quad: {
    name: 'Four Panel',
    count: 4,
    panels: [
      rect(0.02, 0.02, 0.475, 0.36),
      rect(0.505, 0.02, 0.475, 0.36),
      rect(0.02, 0.395, 0.475, 0.36),
      rect(0.505, 0.395, 0.475, 0.36),
    ],
    title: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  hero: {
    name: 'Hero + Three',
    count: 4,
    panels: [
      rect(0.02, 0.02, 0.60, 0.735),
      rect(0.635, 0.02, 0.345, 0.235),
      rect(0.635, 0.27, 0.345, 0.235),
      rect(0.635, 0.52, 0.345, 0.235),
    ],
    title: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  nine: {
    name: 'Nine Panel',
    count: 8,
    titleInGrid: true,
    panels: [
      rect(0.015, 0.015, 0.317, 0.313),
      rect(0.342, 0.015, 0.317, 0.313),
      rect(0.668, 0.015, 0.317, 0.313),
      rect(0.015, 0.343, 0.317, 0.313),
      // centre cell (0.342, 0.343) is the title block, not a photo
      rect(0.668, 0.343, 0.317, 0.313),
      rect(0.015, 0.672, 0.317, 0.313),
      rect(0.342, 0.672, 0.317, 0.313),
      rect(0.668, 0.672, 0.317, 0.313),
    ],
    title: { x: 0.342, y: 0.343, w: 0.317, h: 0.313 },
  },
  tilt: {
    name: 'Tilted Snaps',
    count: 3,
    panels: [
      rect(0.04, 0.05, 0.44, 0.52, -4),
      rect(0.50, 0.10, 0.44, 0.52, 3),
      rect(0.28, 0.42, 0.44, 0.34, -1.5),
    ],
    title: { x: 0, y: 0.80, w: 1, h: 0.20 },
  },
  bands: {
    name: 'Diagonal Bands',
    count: 3,
    diagonal: true,
    panels: [
      rect(-0.06, -0.04, 0.44, 1.08, 0, 'band'),
      rect(0.30, -0.04, 0.44, 1.08, 0, 'band'),
      rect(0.66, -0.04, 0.44, 1.08, 0, 'band'),
    ],
    title: { x: 0, y: 0.76, w: 1, h: 0.24 },
  },
  bleed: {
    name: 'Full Bleed',
    count: 1,
    panels: [rect(0, 0, 1, 1)],
    title: { x: 0, y: 0.74, w: 1, h: 0.26 },
  },
  duo: {
    name: 'Duo',
    count: 2,
    panels: [
      rect(0.02, 0.02, 0.475, 0.735),
      rect(0.505, 0.02, 0.475, 0.735),
    ],
    title: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);
