// Bundled fonts for Vice Cover Studio, all under the SIL Open Font License
// (see fonts/OFL.txt): Anton for the big title, Pacifico for the script
// subtitle, Bebas Neue for badges and labels. Loaded once, from local files,
// so the app works with no network.

let loaded = null;

/** Loads the three bundled fonts into document.fonts. Safe to call twice. */
export function loadFonts() {
  if (loaded) return loaded;
  loaded = (async () => {
    const faces = [
      ['Anton', 'fonts/Anton.ttf'],
      ['Pacifico', 'fonts/Pacifico.ttf'],
      ['Bebas Neue', 'fonts/BebasNeue.ttf'],
    ];
    await Promise.all(faces.map(async ([name, url]) => {
      try {
        const face = new FontFace(name, `url(${url})`);
        await face.load();
        document.fonts.add(face);
      } catch {
        // The canvas falls back to a system sans-serif; the app still works.
      }
    }));
    await document.fonts.ready;
  })();
  return loaded;
}
