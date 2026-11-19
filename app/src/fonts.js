// Bundled fonts for Vice Cover Studio. All three ship under the SIL Open Font
// License (see fonts/OFL.txt): Anton carries the big title, Pacifico the
// script subtitle, Bebas Neue the badges and labels. They load once from
// local files, so the app works with no network at all.

let fontsPromise = null;

/** Loads the three bundled fonts into document.fonts. Safe to call twice. */
export function loadFonts() {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    const faces = [
      { name: 'Anton', file: 'fonts/Anton.ttf' },
      { name: 'Pacifico', file: 'fonts/Pacifico.ttf' },
      { name: 'Bebas Neue', file: 'fonts/BebasNeue.ttf' },
    ];
    await Promise.all(faces.map(async ({ name, file }) => {
      try {
        const face = new FontFace(name, `url(${file})`);
        await face.load();
        document.fonts.add(face);
      } catch {
        // Canvas falls back to a system sans-serif; the app still works.
      }
    }));
    await document.fonts.ready;
  })();
  return fontsPromise;
}
