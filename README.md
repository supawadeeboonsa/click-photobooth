# Click! Photobooth

A virtual Korean-style four-cut photo booth that runs entirely in the browser. Take photos with your camera or upload them, pick a layout, frame and filter, add text and stickers, and download the strip as a PNG. No backend, database or account.

**Stack:** React 19, Vite, TypeScript, Tailwind CSS v4, Lucide React, html-to-image.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Node 20.19+ (or 22+) is recommended. The camera needs `localhost` or HTTPS.

## Design source

The UI follows the four-screen design made in Claude (Welcome, Capture, Studio, Result): off-white/ink palette, one rose accent, Bricolage Grotesque headings and Figtree body text (loaded from Google Fonts in `index.html`). Design tokens live in `src/index.css` (`@theme`).

## Structure

- `src/store.tsx`: one reducer + context for the whole session (photos survive going back and forth between steps). Frame and filter preferences persist in `localStorage`.
- `src/components/PhotoStrip.tsx`: the single renderer for hero art, live preview and export.
- `src/hooks/useCamera.ts`, `useCountdown.ts`: camera lifecycle (streams are stopped on leaving the page) and shot countdown.
- `src/utils/`: layouts/frames, filters, camera + upload helpers, PNG export.
- `src/pages/`: Welcome, Capture, Editor (Studio), Result.

## Implemented

- Camera capture with permission-denied, no-camera, camera-in-use and unsupported states; camera switching; 3-second countdown; 2/3/4/6 shots in sequence; per-photo retake/remove.
- Upload (JPEG/PNG/WebP, 20 MB limit, drag and drop), replace and remove per slot. Photos are center-cropped to 4:3.
- Layouts: 2-, 3-, 4-, 6-cut and 2×2. Switching never discards photos.
- Frames: five presets, custom background colour, padding slider, caption and optional date.
- Filters: Original, Mono, Warm, Cool, Vintage, plus brightness and contrast.
- Text and six stickers: edit text, colour and size; drag to move (arrow keys when focused); remove.
- PNG export at 1080 px wide from the same component as the preview, with error handling.

## Known limitations

- Not yet tested in a real browser with a physical camera; verify camera, countdown and download on your devices (especially iOS Safari).
- Filters use CSS `filter`, which html-to-image renders in Chromium and Firefox; older Safari versions may export without filters.
- Web fonts load from Google Fonts; offline, the export falls back to system fonts. Self-host fonts in `public/fonts` to avoid this.
- `public/frames` and `public/stickers` are empty placeholders: frames and stickers are drawn with CSS and Lucide icons.
- Decorations use percentage positions; the strip is a fixed 4:3 cell grid.
