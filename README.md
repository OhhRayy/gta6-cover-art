# Vice Cover Studio — GTA 6-style cover art maker

An offline web app that turns any photo and a caption into GTA-poster-style
cover art, exported as a PNG to share. Built for the make.fun bounty
`gta6-cover-art-01`.

## What it does

- **6 layouts**: Four Panel, Hero + Three, Nine Panel (title in the centre
  cell), Tilted Snaps, Diagonal Bands, Full Bleed.
- **6 colour grades**: Vice Sunset, Neon Night, Palm Gold, Ocean Drive,
  Bubblegum, Mono Heat — sunset and neon gradients, photo tints, halftone
  title bands, film grain and vignette.
- **Any photo**: upload your own photos, or use the four bundled AI-made
  samples. Each panel takes its own photo, or one photo can fill all panels.
  Drag a photo in the preview to reposition it, zoom and pan per panel, and
  edit the title, script subtitle, badge ribbon and 5-star heat meter.
- **Fast**: one click from a sample photo to an exported PNG in 1080 × 1080,
  1080 × 1350 or 1920 × 1080. Undo and redo included (Ctrl+Z).
- **Offline**: static files under `app/`, no network request. The fonts
  (Anton, Pacifico, Bebas Neue) are bundled under the SIL Open Font License.

## Try it

```sh
node serve.ts   # http://localhost:8080
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` there with the vendored make.fun library.

## Originality

All art, lettering and code are original. No Rockstar Games logo, artwork,
character or font is used. The sample photos were made with an image model
(no real people). Not affiliated with Rockstar Games.
