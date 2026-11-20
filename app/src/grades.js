// Colour grades for Vice Cover Studio. Each grade is an original palette: a
// three-stop sky gradient, a tint washed over the photos, a title-band
// gradient, a title colour, an accent and a subtitle colour. Nothing here
// copies Rockstar logos, artwork or fonts — every value below is our own.

// A grade: sky stops, photo tint, band stops, title ink, accent, subtitle ink.
// `pop` is the bright colour for the star meter and badge fill: it defaults to
// the accent, but a dark accent (Palm Gold's brown) would vanish on the dark
// pill, so that grade names a bright pop instead.
export const GRADES = {
  // Warm dusk: orange into pink into purple.
  sunset: {
    name: 'Vice Sunset',
    accent: '#ffd166',
    title: '#ffffff',
    sub: '#ffe9a8',
    sky: ['#ff9a3d', '#ff5e78', '#7b2fbe'],
    tint: 'rgba(255, 94, 120, 0.22)',
    band: ['#1d0b2e', '#ff5e78'],
  },
  // After dark: deep blue, violet, hot pink, cyan accents.
  neon: {
    name: 'Neon Night',
    accent: '#2de2ff',
    title: '#ffffff',
    sub: '#a5f3ff',
    sky: ['#0b1035', '#7b2fbe', '#ff2e88'],
    tint: 'rgba(255, 46, 136, 0.20)',
    band: ['#05081f', '#ff2e88'],
  },
  // Golden hour: honey yellow into burnt orange.
  gold: {
    name: 'Palm Gold',
    accent: '#7a3b12',
    pop: '#ffd166',
    title: '#fff7e0',
    sub: '#ffe9a8',
    sky: ['#ffd166', '#ff8c42', '#7a3b12'],
    tint: 'rgba(255, 140, 66, 0.20)',
    band: ['#2b1608', '#ff8c42'],
  },
  // Seaside blue: cyan into royal blue into night.
  drive: {
    name: 'Ocean Drive',
    accent: '#ffd166',
    title: '#ffffff',
    sub: '#cfe8ff',
    sky: ['#2de2ff', '#2b6cff', '#0b1035'],
    tint: 'rgba(43, 108, 255, 0.20)',
    band: ['#04122e', '#2b6cff'],
  },
  // Candy pink and violet with a cyan pop.
  bubblegum: {
    name: 'Bubblegum',
    accent: '#2de2ff',
    title: '#ffffff',
    sub: '#ffd7ef',
    sky: ['#ff8fd1', '#b967ff', '#1d0b2e'],
    tint: 'rgba(185, 103, 255, 0.22)',
    band: ['#160a2e', '#ff8fd1'],
  },
  // Posterised heat: yellow into red, dark red band.
  heat: {
    name: 'Mono Heat',
    accent: '#ffe66d',
    title: '#fff3c4',
    sub: '#ffe66d',
    sky: ['#ffe66d', '#ff5e3a', '#8f1d1d'],
    tint: 'rgba(255, 94, 58, 0.25)',
    band: ['#2b0808', '#ff5e3a'],
  },
};

export const GRADE_IDS = Object.keys(GRADES);
