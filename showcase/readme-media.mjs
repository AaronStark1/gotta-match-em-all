#!/usr/bin/env node
/* ==========================================================================
   Gotta Match 'Em All: README media
   Screenshots of the production build for the app's README, plus a short
   animated gameplay preview cut from the reel, all written to ../docs/media/.
   It reuses the reel's build, demo data and seeded deal (record-showcase.mjs),
   so every run shows the same board, records and Pokédex.

     npm run media

   Desktop: 1440x810 CSS px at 4/3, so 1920x1080 like the reel. The hero keeps
   that size; the gallery is scaled to 1440x810, which keeps the CRT
   scanlines on whole pixels. Phones: 390x844 CSS px at 2x, with touch input.
   The preview needs out/pokemon-match-showcase.mp4 from `npm run record`;
   without it, the existing preview is left as it is.
   ========================================================================== */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  ROOT,
  APP_DIST,
  OUT_MP4,
  SPRITES,
  SPECIES,
  STORAGE,
  INIT,
  POSTER_POSE,
  EXPECTED_LAYOUT,
  DEX,
  buildApp,
  ensureSprites,
  serve,
  ffmpeg,
  sleep,
} from './record-showcase.mjs';

const MEDIA = path.join(ROOT, 'docs', 'media');
// Lossless captures, deleted once converted
const RAW = path.join(path.dirname(APP_DIST), 'media');

const DESKTOP = { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// [capture, file in docs/media, width]
const OUTPUTS = [
  ['title', 'title-screen.webp', 1920],
  ['menu', 'menu.webp', 1440],
  ['board', 'board.webp', 1440],
  ['win', 'victory.webp', 1440],
  ['help', 'help.webp', 1440],
  ['404', 'missingno-404.webp', 1440],
  ['phone-title', 'phone-title.webp', 780],
  ['phone-board', 'phone-board.webp', 780],
  ['phone-win', 'phone-victory.webp', 780],
];
const QUALITY = 85;

/* The reel's first Gameplay beats: a mismatch (shake + buzz), then the
   Pikachu match. It ends before the reel's own streak badge appears. */
const PREVIEW = { file: 'gameplay.webp', from: 14.9, duration: 5.6, fps: 15, width: 960, quality: 72 };

// NEW BEST! blinks four times (visible for the first half of each second): park it lit
const WIN_POSE = { winBlink: 250 };

/* ---------------------------------------------------------------- browser */
async function openApp(browser, base, device) {
  const context = await browser.newContext({
    ...device,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
  });
  // The reel's demo data: cached PokéAPI sprites and the pinned six-species list
  await context.route('https://raw.githubusercontent.com/PokeAPI/sprites/**', async (route) => {
    const id = route.request().url().match(/\/(\d+)\.png$/)?.[1];
    const file = id && path.join(SPRITES, `${id}.png`);
    if (!file || !fs.existsSync(file)) return route.abort();
    return route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=86400' },
      body: await fsp.readFile(file),
    });
  });
  await context.route('https://pokeapi.co/api/v2/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(SPECIES),
    })
  );
  await context.addInitScript(INIT);

  const page = await context.newPage();
  // Write the lived-in save on the app's origin, then load the title screen with it
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.evaluate((entries) => {
    localStorage.clear();
    sessionStorage.clear();
    for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, JSON.stringify(v));
  }, STORAGE);
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

const visible = (page, selector) => page.waitForSelector(selector, { state: 'visible', timeout: 20000 });

// Real input at the element's centre: a tap on phones, a click on desktop
async function press(page, selector, index = 0) {
  const target = page.locator(selector).nth(index);
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error(`${selector}[${index}] is not on screen`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (page.viewportSize().width < 600) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

// Park named CSS animations at a point of their cycle (ms of active time), like the reel's poster
const park = (page, times) =>
  page.evaluate((pose) => {
    const parked = [];
    for (const animation of document.getAnimations()) {
      const name = animation.animationName;
      if (!(name in pose)) continue;
      animation.pause();
      animation.currentTime = pose[name] + (animation.effect?.getTiming?.().delay ?? 0);
      parked.push(name);
    }
    return parked;
  }, times);

async function shot(page, name) {
  if (!name) return;
  await page.mouse.move(2, 2); // no hover styles in the frame
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await sleep(150);
  await page.screenshot({ path: path.join(RAW, `${name}.png`) });
}

/* ---------------------------------------------------------------- the tour */
const cardIndex = (name, which) => EXPECTED_LAYOUT.flatMap((id, i) => (id === DEX[name] ? [i] : []))[which];

async function flip(page, name, which) {
  await press(page, `.card[data-index="${cardIndex(name, which)}"]`);
  await sleep(600);
}

async function catchPair(page, name) {
  await flip(page, name, 0);
  await flip(page, name, 1);
  await sleep(500); // golden pulse and name banner
}

/* Title -> menu -> Easy board -> victory, then Help and the 404 page.
   `names` maps each stop to a capture name; stops without one are passed
   through. The deal is seeded on the way into /play, so it is checked. */
async function tour(browser, base, device, names) {
  const { context, page } = await openApp(browser, base, device);
  try {
    await visible(page, '.landing-start');
    await sleep(1800); // wallpaper GIF decoded and animating
    const parked = await park(page, POSTER_POSE);
    if (parked.length < Object.keys(POSTER_POSE).length) {
      console.warn(`note: title pose parked only ${parked.join(', ') || 'nothing'}`);
    }
    await shot(page, names.title);

    await press(page, '.landing-start'); // PRESS START
    await visible(page, '.difficulty-option');
    await sleep(1500);
    await shot(page, names.menu);

    await press(page, '.difficulty-option', 0); // Easy
    await press(page, '.landing-actions .landing-start'); // START GAME
    await visible(page, '.card[data-pokemon-id]');
    await page.waitForSelector('.loader-overlay', { state: 'detached', timeout: 20000 });
    const layout = await page.$$eval('.card[data-pokemon-id]', (cards) => cards.map((c) => Number(c.dataset.pokemonId)));
    if (JSON.stringify(layout) !== JSON.stringify(EXPECTED_LAYOUT)) {
      throw new Error(`Seeded deal changed: got ${JSON.stringify(layout)}, expected ${JSON.stringify(EXPECTED_LAYOUT)}`);
    }
    await sleep(800);

    // Two pairs caught and a third card face up
    await catchPair(page, 'pikachu');
    await catchPair(page, 'gengar');
    await flip(page, 'squirtle', 0);
    await shot(page, names.board);

    // A perfect six-move clear: 3 stars, two New Bests and six Pokédex entries
    await flip(page, 'squirtle', 1);
    await sleep(500);
    for (const name of ['bulbasaur', 'jigglypuff', 'charmander']) await catchPair(page, name);
    await visible(page, '.win-box');
    await sleep(2900); // stars and sparkles in, confetti still falling
    await park(page, WIN_POSE);
    await shot(page, names.win);

    if (names.help) {
      await page.goto(`${base}/help`, { waitUntil: 'load' });
      await visible(page, '.help-manual');
      await sleep(1500);
      await shot(page, names.help);
    }
    if (names.missing) {
      await page.goto(`${base}/missingno`, { waitUntil: 'load' });
      await visible(page, '.typed-message');
      // "Error 404" is typed out by ~4 s; MISSINGNO. holds its rest frame until ~7.3 s
      await sleep(5000);
      await shot(page, names.missing);
    }
  } finally {
    await context.close();
  }
}

/* ---------------------------------------------------------------- output */
function toWebp(name, file, width) {
  const out = path.join(MEDIA, file);
  ffmpeg([
    '-i', path.join(RAW, `${name}.png`),
    '-vf', `scale=${width}:-2:flags=lanczos`,
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libwebp', '-quality', String(QUALITY), '-compression_level', '6', '-preset', 'picture',
    out,
  ]);
  return out;
}

function preview() {
  const out = path.join(MEDIA, PREVIEW.file);
  if (!fs.existsSync(OUT_MP4)) {
    console.log(`preview: no ${path.relative(ROOT, OUT_MP4)} (run npm run record); kept ${path.relative(ROOT, out)}`);
    return null;
  }
  ffmpeg([
    '-ss', String(PREVIEW.from), '-t', String(PREVIEW.duration), '-i', OUT_MP4,
    '-vf', `fps=${PREVIEW.fps},scale=${PREVIEW.width}:-2:flags=lanczos`,
    '-an', '-c:v', 'libwebp_anim', '-quality', String(PREVIEW.quality), '-compression_level', '6', '-loop', '0',
    out,
  ]);
  return out;
}

async function main() {
  const t0 = Date.now();
  await fsp.rm(RAW, { recursive: true, force: true });
  await fsp.mkdir(RAW, { recursive: true });
  await fsp.mkdir(MEDIA, { recursive: true });
  console.log('building the app…');
  buildApp();
  await ensureSprites();

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    channel: 'chromium',
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  try {
    console.log('desktop tour…');
    await tour(browser, base, DESKTOP, { title: 'title', menu: 'menu', board: 'board', win: 'win', help: 'help', missing: '404' });
    console.log('phone tour…');
    await tour(browser, base, PHONE, { title: 'phone-title', board: 'phone-board', win: 'phone-win' });
  } finally {
    await browser.close();
    server.close();
    // Never leave a built bundle where the app's ESLint would find it
    await fsp.rm(APP_DIST, { recursive: true, force: true });
  }

  const kb = (file) => `${(fs.statSync(file).size / 1024).toFixed(0)} KB`;
  for (const [name, file, width] of OUTPUTS) {
    const out = toWebp(name, file, width);
    console.log(`${kb(out).padStart(7)}  ${path.relative(ROOT, out)}`);
  }
  const anim = preview();
  if (anim) console.log(`${kb(anim).padStart(7)}  ${path.relative(ROOT, anim)}`);
  await fsp.rm(RAW, { recursive: true, force: true });
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
