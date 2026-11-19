// Colour grades for Vice Cover Studio. Every grade is original: a sky gradient,
// a photo tint, a title-band gradient and an accent colour. No Rockstar artwork,
// logos or fonts are used anywhere in this app.

export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    sky: ['#ff9a3d', '#ff5e78', '#7b2fbe'],
    tint: 'rgba(255, 94, 120, 0.22)',
    band: ['#1d0b2e', '#ff5e78'],
    title: '#ffffff',
    accent: '#ffd166',
    sub: '#ffe9a8',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#0b1035', '#7b2fbe', '#ff2e88'],
    tint: 'rgba(255, 46, 136, 0.20)',
    band: ['#05081f', '#ff2e88'],
    title: '#ffffff',
    accent: '#2de2ff',
    sub: '#a5f3ff',
  },
  gold: {
    name: 'Palm Gold',
    sky: ['#ffd166', '#ff8c42', '#7a3b12'],
    tint: 'rgba(255, 140, 66, 0.20)',
    band: ['#2b1608', '#ff8c42'],
    title: '#fff7e0',
    accent: '#7a3b12',
    sub: '#ffe9a8',
  },
  drive: {
    name: 'Ocean Drive',
    sky: ['#2de2ff', '#2b6cff', '#0b1035'],
    tint: 'rgba(43, 108, 255, 0.20)',
    band: ['#04122e', '#2b6cff'],
    title: '#ffffff',
    accent: '#ffd166',
    sub: '#cfe8ff',
  },
  bubblegum: {
    name: 'Bubblegum',
    sky: ['#ff8fd1', '#b967ff', '#1d0b2e'],
    tint: 'rgba(185, 103, 255, 0.22)',
    band: ['#160a2e', '#ff8fd1'],
    title: '#ffffff',
    accent: '#2de2ff',
    sub: '#ffd7ef',
  },
  heat: {
    name: 'Mono Heat',
    sky: ['#ffe66d', '#ff5e3a', '#8f1d1d'],
    tint: 'rgba(255, 94, 58, 0.25)',
    band: ['#2b0808', '#ff5e3a'],
    title: '#fff3c4',
    accent: '#ffe66d',
    sub: '#ffe66d',
  },
};

export const GRADE_IDS = Object.keys(GRADES);
