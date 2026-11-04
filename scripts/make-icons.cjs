// Renders the app icons in public/icons/ from the favicon design in public/favicon.svg:
// a plum tile with "Afro" and "Tech" on two lines and plant-like threads behind them.
// Run after changing the design: node scripts/make-icons.cjs "$PWD" (needs Playwright).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
const out = path.join(root, 'public', 'icons');
// Embedded as a data URL: a page made with setContent can't load file:// fonts.
const font = 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2')).toString('base64');
const svg = fs.readFileSync(path.join(root, 'public', 'favicon.svg'), 'utf8')
  // App icons are full squares (the phone applies its own mask) in the light colours.
  .replace(/rx="22"/, 'rx="0"')
  .replace(/@media \(prefers-color-scheme: dark\) \{[\s\S]*?\}\s*\}/, '');

// content: how much of the tile the design fills; maskable icons keep the text
// inside the circle Android may crop to, so the whole design shrinks a little.
const icons = [
  { file: 'icon-192.png', size: 192, content: 1 },
  { file: 'icon-512.png', size: 512, content: 1 },
  { file: 'icon-maskable-512.png', size: 512, content: 0.8 },
  { file: 'apple-touch-icon.png', size: 180, content: 1 },
];

(async () => {
  const b = await chromium.launch();
  for (const { file, size, content } of icons) {
    const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<!doctype html><style>
      @font-face { font-family: "IBM Plex Sans"; src: url("${font}") format("woff2"); font-weight: 600; }
      html, body { margin: 0; width: ${size}px; height: ${size}px; background: #7a2e5c; }
      body { display: grid; place-items: center; }
      svg { width: ${size * content}px; height: ${size * content}px; display: block; }
    </style><body>${svg}</body>`);
    await p.evaluate(() => document.fonts.load('600 30px "IBM Plex Sans"'));
    const ok = await p.evaluate(() => document.fonts.check('600 30px "IBM Plex Sans"'));
    if (!ok) throw new Error('IBM Plex Sans did not load; icons would use a fallback font');
    await p.screenshot({ path: path.join(out, file) });
    await p.close();
  }
  await b.close();
  console.log('icons written to', out);
})();
