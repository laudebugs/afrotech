// Renders the app icons in public/icons/ from the favicon design: a plum square with "26".
// Run after changing the brand colour: node scripts/make-icons.cjs "$PWD" (needs Playwright).
const { chromium } = require('playwright');
const path = require('path');
const root = process.argv[2];
const out = path.join(root, 'public', 'icons');
const font = 'file://' + path.join(root, 'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2');

// scale: share of the tile the "26" spans; maskable icons keep it inside the safe circle.
const icons = [
  { file: 'icon-192.png', size: 192, scale: 0.5 },
  { file: 'icon-512.png', size: 512, scale: 0.5 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.36 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.5 },
];

(async () => {
  const b = await chromium.launch();
  for (const { file, size, scale } of icons) {
    const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<!doctype html><style>
      @font-face { font-family: Plex; src: url("${font}") format("woff2"); font-weight: 600; }
      html, body { margin: 0; width: ${size}px; height: ${size}px; }
      body { display: grid; place-items: center; background: #7a2e5c; color: #ffffff;
             font: 600 ${Math.round(size * scale * 0.82)}px/1 Plex, sans-serif; letter-spacing: -0.02em; }
    </style><body>26</body>`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(out, file), omitBackground: false });
    await p.close();
  }
  await b.close();
  console.log('icons written to', out);
})();
