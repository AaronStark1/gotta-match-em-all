#!/usr/bin/env node
/* ==========================================================================
   Gotta Match 'Em All: 45-second showcase reel
   Builds the app, plays a real game in Playwright Chromium inside a
   "director stage" (stage/), records it as CDP screencast frames, then cuts
   a 1920x1080 30 fps MP4 with a matching soundtrack and a WebP poster.
   See README.md.

     npm install && npm run record        full pipeline
     node record-showcase.mjs --keep      keep .work/ (raw frames, clip, take.json)
     node record-showcase.mjs --reencode  re-cut + re-encode the kept take only

   Everything is the running app. The stage only adds the reel's broadcast
   layer around it (camera, CRT warm-up, callouts, pointer, the handheld
   shell) and resizes the app's iframe for the responsive morph.

   The loop: the reel opens on a still of the title screen, eases into the
   live take, plays a whole game, presses HOME on the win screen and settles
   back onto the very same still, so the last frame equals the first.
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { buildSoundtrack } from './audio.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const WORK = path.join(HERE, '.work');
const APP_DIST = path.join(WORK, 'app');
const FRAMES = path.join(WORK, 'frames');
const CLIP = path.join(WORK, 'clip');
const SPRITES = path.join(HERE, '.cache', 'sprites');
const STAGE_DIR = path.join(HERE, 'stage');
const CURSORS = path.join(ROOT, 'src', 'assets', 'cursors');
const SOUNDS = {
  match: path.join(ROOT, 'src', 'assets', 'sounds', 'card_match.mp3'),
  victory: path.join(ROOT, 'src', 'assets', 'sounds', 'pokemon-victory-theme.mp3'),
};
const OUT = path.join(HERE, 'out');
const OUT_MP4 = path.join(OUT, 'pokemon-match-showcase.mp4');
const OUT_POSTER = path.join(OUT, 'pokemon-match-poster.webp');
// Lossless master of the poster; the portfolio uses it as the card thumbnail (project5.png)
const OUT_POSTER_PNG = path.join(OUT, 'pokemon-match-poster.png');
const POSTER_PNG = path.join(WORK, 'poster.png');
const SOUNDTRACK = path.join(WORK, 'soundtrack.wav');
const SOUNDTRACK_NORM = path.join(WORK, 'soundtrack-norm.wav');
const KEEP = process.argv.includes('--keep');
const REENCODE = process.argv.includes('--reencode');

/* 1440x810 CSS px at 4/3 = 1920x1080 device px. At this size the Easy board
   fills the frame top to bottom with ~285px margins for callouts. The scale
   is set on the browser (--force-device-scale-factor), not by viewport
   emulation, so CDP screencast frames arrive at the full 1920x1080. */
const VIEWPORT = { width: 1440, height: 810 };
const SCALE = 1920 / 1440;
const OUT_W = 1920;
const OUT_H = 1080;
const FPS = 30;
const DURATION = 45;
const TOTAL_FRAMES = DURATION * FPS; // 1350
/* Loop seam. Frame 0 is the poster still (the title screen at rest); the
   live take fades in under the CRT warm-up. After HOME the live title screen
   fades back onto the same still, which holds for the last frames. Both
   fades are title screen onto title screen, so only the looping animations
   (wallpaper GIF, button aura, glints) blend. */
const HEAD_HOLD = 0.1;
const HEAD_XFADE = 0.5;
const TAIL_AT = 44.3;
const TAIL_XFADE = 0.5;
/* ~9 MB: two-pass x264 at 1.6 Mb/s. The animated anime-GIF backdrops under
   the CRT scanlines stay clean through camera moves at this rate. */
const VIDEO_KBPS = 1600;
const VIDEO_MAXRATE = 2800;
const VIDEO_BUFSIZE = 3600;
const AUDIO_KBPS = 128;

/* ---------------------------------------------------------------- demo data
   The species list is pinned to six Pokémon and Math.random is seeded, so
   every run deals the same board on the same background (seed 15: bg2).
   Sprites are the real PokéAPI sprites, cached locally on first run. */
const SEED = 15;
const CAST = [
  [25, 'pikachu'],
  [4, 'charmander'],
  [94, 'gengar'],
  [7, 'squirtle'],
  [1, 'bulbasaur'],
  [39, 'jigglypuff'],
];
const DEX = Object.fromEntries(CAST.map(([id, name]) => [name, id]));
const EXPECTED_LAYOUT = [7, 1, 39, 94, 25, 4, 7, 25, 39, 1, 4, 94];
const SPECIES = {
  count: CAST.length,
  next: null,
  previous: null,
  results: CAST.map(([id, name]) => ({ name, url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` })),
};
const SPRITE_URL = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// A lived-in save: prior records to beat and a 37-species Pokédex (none of the cast).
const STORAGE = {
  'gmea:best:easy': { score: 480, time: 52 },
  'gmea:best:medium': { score: 640, time: 97 },
  'gmea:pokedex:v1': [2, 3, 5, 6, 8, 9, 10, 12, 16, 19, 35, 37, 41, 43, 52, 54, 58, 60, 63, 66, 74, 77, 79, 81, 92, 95, 104, 109, 113, 120, 129, 131, 133, 143, 147, 152, 155],
  'gmea:difficulty': 'easy', // the menu opens on Easy, with Easy's records in the Hall of Fame
  'gmea:muted': false,
  'gmea:crt': true,
};

/* The take's species request is held this long so the real "Catching
   Pokémon..." preloader wobbles on screen before it dissolves into the board. */
const LOADER_HOLD_MS = 950;

/* Poster: the title screen with each looping animation parked at a
   flattering point of its cycle (ms of active time): the PRESS START aura at
   full glow, both logo glints lit, the footer Poké Ball at the top of its hop. */
const POSTER_POSE = {
  'landing-glow-high': 840,
  'landing-glow-mid': 840,
  'landing-glint': 2260,
  'landing-ball-hop': 540,
};

/* ---------------------------------------------------------------- utils */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now() / 1000;
const sleepUntil = (t) => sleep(Math.max(0, (t - now()) * 1000));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Seeded PRNG so pointer paths are identical on every run
let handSeed = 0x5eed15;
function rand() {
  handSeed = (handSeed + 0x6d2b79f5) | 0;
  let t = Math.imul(handSeed ^ (handSeed >>> 15), 1 | handSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (lo, hi) => lo + (hi - lo) * rand();

function ffmpeg(args, { level = 'warning' } = {}) {
  const res = spawnSync(ffmpegPath, ['-hide_banner', '-loglevel', level, '-y', ...args], {
    stdio: ['ignore', 'inherit', 'pipe'],
    maxBuffer: 1 << 26,
  });
  const err = res.stderr ? res.stderr.toString() : '';
  if (res.status !== 0) throw new Error(`ffmpeg failed (${res.status}): ${err}\n  ${args.join(' ')}`);
  return err;
}

/* ---------------------------------------------------------------- app build + sprite cache */
function buildApp() {
  const vite = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(vite)) throw new Error('Run `npm install` in the app root first (vite not found).');
  const res = spawnSync(process.execPath, [vite, 'build', '--outDir', APP_DIST, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (res.status !== 0) throw new Error('vite build failed');
}

async function ensureSprites() {
  await fsp.mkdir(SPRITES, { recursive: true });
  for (const [id] of CAST) {
    const file = path.join(SPRITES, `${id}.png`);
    if (fs.existsSync(file) && fs.statSync(file).size > 0) continue;
    let lastError;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fetch(SPRITE_URL(id), { signal: AbortSignal.timeout(45000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fsp.writeFile(file, Buffer.from(await res.arrayBuffer()));
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        await sleep(1000 * attempt);
      }
    }
    if (lastError) throw new Error(`Could not download sprite ${id}: ${lastError.message}`);
  }
}

/* ---------------------------------------------------------------- static server
   /__stage/*         the director stage (+ the app's own cursor PNGs, poster)
   everything else    the production build, with SPA fallback for /menu, /play */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    let file;
    let cache = 'no-store';
    if (p === '/__stage/poster.png') file = POSTER_PNG;
    else if (p.startsWith('/__stage/cursors/')) file = path.join(CURSORS, path.basename(p));
    else if (p.startsWith('/__stage/')) file = path.join(STAGE_DIR, path.normalize(p.slice('/__stage/'.length) || 'index.html'));
    else {
      file = path.join(APP_DIST, path.normalize(p));
      cache = 'public, max-age=3600';
      if (!file.startsWith(APP_DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(APP_DIST, 'index.html');
        cache = 'no-store';
      }
    }
    if (p === '/__stage/' || p === '/__stage') file = path.join(STAGE_DIR, 'index.html');
    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': cache });
      res.end(body);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/* ---------------------------------------------------------------- init script (every frame)
   App frames: seeded Math.random, re-seeded whenever /play is pushed (the
   router spends one value on the history key just before), so every pass
   deals the identical board. In the iframe it also forwards pointer events
   to the stage and logs the app's own sounds for the soundtrack. */
const INIT = `(() => {
  if (location.pathname.startsWith('/__stage')) return;
  const SEED = ${SEED};
  let s = SEED >>> 0;
  Math.random = function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const push = history.pushState;
  history.pushState = function (state, title, url) {
    try { if (new URL(url, location.href).pathname === '/play') s = SEED >>> 0; } catch (e) {}
    return push.apply(this, arguments);
  };
  if (window.top === window) return;
  const top = window.top;
  const stamp = () => performance.timeOrigin + performance.now();
  const ev = (type, data) => { try { if (top.__ev) top.__ev.push(Object.assign({ type: type, t: stamp() }, data)); } catch (e) {} };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    ev('audio', { src: String(this.currentSrc || this.src) });
    return play.apply(this, arguments);
  };
  const pause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.pause = function () {
    if (!this.paused) ev('audio-pause', { src: String(this.currentSrc || this.src) });
    return pause.apply(this, arguments);
  };
  if (window.OscillatorNode) {
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function () { ev('buzz', {}); return start.apply(this, arguments); };
  }
  const fwd = (type) => (e) => {
    try {
      const fe = window.frameElement;
      if (!fe || !top.__stagePointer) return;
      const r = fe.getBoundingClientRect();
      const k = r.width / fe.clientWidth;
      const cursor = String(getComputedStyle(e.target).cursor || '');
      top.__stagePointer(type, r.left + e.clientX * k, r.top + e.clientY * k, /pointer\\s*$/.test(cursor) ? 'pointer' : 'arrow');
    } catch (err) {}
  };
  addEventListener('mousemove', fwd('move'), { capture: true, passive: true });
  addEventListener('mousedown', fwd('down'), { capture: true, passive: true });
  addEventListener('mouseup', fwd('up'), { capture: true, passive: true });
})();`;

/* ---------------------------------------------------------------- human input */
class Hand {
  constructor(page) {
    this.page = page;
    this.x = VIEWPORT.width + 40;
    this.y = VIEWPORT.height * 0.8;
  }

  /* Minimum-jerk easing along a gently bowed cubic Bézier. */
  async glideTo(x, y, ms) {
    const from = { x: this.x, y: this.y };
    const dx = x - from.x;
    const dy = y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const dur = ms ?? clamp(380 + dist * 0.5, 420, 1100);
    const bow = clamp(dist * 0.08, 0, 38) * (rand() < 0.5 ? -1 : 1);
    const nx = -dy / dist;
    const ny = dx / dist;
    const c1 = { x: from.x + dx * 0.28 + nx * bow, y: from.y + dy * 0.28 + ny * bow };
    const c2 = { x: from.x + dx * 0.78 + nx * bow * 0.5, y: from.y + dy * 0.78 + ny * bow * 0.5 };
    const t0 = performance.now();
    for (;;) {
      const e = Math.min(1, (performance.now() - t0) / dur);
      const s = e * e * e * (10 - 15 * e + 6 * e * e);
      const u = 1 - s;
      const px = u * u * u * from.x + 3 * u * u * s * c1.x + 3 * u * s * s * c2.x + s * s * s * x;
      const py = u * u * u * from.y + 3 * u * u * s * c1.y + 3 * u * s * s * c2.y + s * s * s * y;
      await this.page.mouse.move(px, py);
      if (e >= 1) break;
      await sleep(5);
    }
    this.x = x;
    this.y = y;
  }

  async jump(x, y) {
    await this.page.mouse.move(x, y);
    this.x = x;
    this.y = y;
  }

  /* Mouse down, hold, up. Returns the moment of release (the click). */
  async press(hold = between(70, 95)) {
    await this.page.mouse.down();
    await sleep(hold);
    const t = now();
    await this.page.mouse.up();
    return t;
  }
}

/* ---------------------------------------------------------------- capture */
async function startCapture(page) {
  await fsp.mkdir(FRAMES, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  const writes = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    const file = path.join(FRAMES, `${String(frames.length).padStart(6, '0')}.jpg`);
    frames.push({ t: metadata.timestamp ?? now(), file });
    writes.push(fsp.writeFile(file, Buffer.from(data, 'base64')));
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: OUT_W, maxHeight: OUT_H, everyNthFrame: 1 });
  return {
    frames,
    async stop() {
      await cdp.send('Page.stopScreencast').catch(() => {});
      await Promise.all(writes);
      await cdp.detach().catch(() => {});
    },
  };
}

/* New headless sizes the whole (invisible) window, toolbar included: grow it
   until the page itself is exactly 1440x810. */
async function fitWindow(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    for (let i = 0; i < 4; i++) {
      const [w, h] = await page.evaluate(() => [innerWidth, innerHeight]);
      if (w === VIEWPORT.width && h === VIEWPORT.height) return;
      const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId });
      await cdp.send('Browser.setWindowBounds', {
        windowId,
        bounds: { width: bounds.width + VIEWPORT.width - w, height: bounds.height + VIEWPORT.height - h },
      });
      await sleep(250);
    }
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/* ---------------------------------------------------------------- the take */
async function record(base) {
  /* Chromium's new headless mode composites on the GPU (Metal through ANGLE
     on macOS), which roughly doubles screencast throughput over the
     software-rendered headless shell: ~45-55 fps at 1080p here. */
  const browser = await chromium.launch({
    channel: 'chromium',
    args: [
      // 6 decimals: the full-precision 4/3 would round the window up a pixel
      `--force-device-scale-factor=${SCALE.toFixed(6)}`,
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      '--autoplay-policy=no-user-gesture-required',
      '--hide-scrollbars',
      ...(process.platform === 'darwin' ? ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'] : []),
    ],
  });
  try {
    const context = await browser.newContext({
      viewport: null,
      colorScheme: 'dark',
      reducedMotion: 'no-preference',
      locale: 'en-US',
      timezoneId: 'Asia/Kolkata',
    });

    let holdSpecies = 0;
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
    await context.route('https://pokeapi.co/api/v2/**', async (route) => {
      if (holdSpecies) await sleep(holdSpecies);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(SPECIES),
      });
    });
    await context.addInitScript(INIT);

    const page = await context.newPage();
    const S = (fn, ...args) => page.evaluate(([f, a]) => window.stage[f](...a), [fn, args]);
    const appClick = (selector, index = 0) =>
      page.evaluate(([sel, i]) => document.getElementById('app').contentDocument.querySelectorAll(sel)[i].click(), [selector, index]);

    const openStage = async () => {
      await page.goto(`${base}/__stage/`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.stage && document.fonts.status === 'loaded');
      await page.evaluate(async () => {
        await document.fonts.load('12px "Press Start 2P"');
        await document.fonts.load('22px "VT323"');
      });
    };
    const seedStorage = () =>
      page.evaluate((entries) => {
        localStorage.clear();
        sessionStorage.clear();
        for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, JSON.stringify(v));
      }, STORAGE);

    // Title -> menu -> Easy -> Start Game, by plain DOM clicks (off camera)
    const enterBoard = async () => {
      await S('load', '/');
      await S('ready', '.landing-start');
      await appClick('.landing-start');
      await S('ready', '.difficulty-option');
      await appClick('.difficulty-option', 0);
      await appClick('.landing-actions .landing-start');
      await S('ready', '.card[data-pokemon-id]');
      await page.waitForFunction(() => !document.getElementById('app').contentDocument.querySelector('.loader-overlay'));
    };

    /* Warm-up, off camera: fonts, GIFs and sprites into the cache, and a
       check that the seeded deal is the one the choreography expects. */
    await page.goto(`${base}/__stage/`, { waitUntil: 'load' });
    await fitWindow(page);
    const view = await page.evaluate(() => [innerWidth, innerHeight, Math.round(innerWidth * devicePixelRatio)]);
    if (view[0] !== VIEWPORT.width || view[1] !== VIEWPORT.height || view[2] !== OUT_W) {
      throw new Error(`Unexpected window ${view.join('x')}; expected ${VIEWPORT.width}x${VIEWPORT.height} at ${OUT_W}px wide`);
    }
    await seedStorage();
    await openStage();
    await enterBoard();
    const warmLayout = await S('layout');
    if (JSON.stringify(warmLayout) !== JSON.stringify(EXPECTED_LAYOUT)) {
      throw new Error(`Seeded deal changed: got ${JSON.stringify(warmLayout)}, expected ${JSON.stringify(EXPECTED_LAYOUT)}`);
    }
    const at = (id, which = 0) => warmLayout.flatMap((v, i) => (v === id ? [i] : []))[which];
    const card = (name, which) => at(DEX[name], which);

    /* Poster pass: the title screen at rest, its looping animations parked at
       a flattering point (POSTER_POSE). This still is the reel's first and
       last frame, the WebP poster and the portfolio card's thumbnail. */
    await seedStorage();
    await openStage();
    await S('load', '/');
    await S('ready', '.landing-start');
    await sleep(1800); // wallpaper GIF decoded and animating
    const parked = await S('freezeAll', POSTER_POSE);
    if (parked.length < Object.keys(POSTER_POSE).length) {
      throw new Error(`poster pose: only parked ${parked.join(', ') || 'nothing'}`);
    }
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await sleep(150);
    await page.screenshot({ path: POSTER_PNG });

    /* ------------------------------------------------------------ main take */
    await seedStorage();
    await openStage();
    await S('load', '/');
    await S('ready', '.landing-start');
    await sleep(1500); // wallpaper GIF decoded, glow loop running
    holdSpecies = LOADER_HOLD_MS;

    const hand = new Hand(page);
    hand.y = 640;
    await page.evaluate(([x, y]) => window.__stagePointer('move', x, y, 'arrow'), [hand.x, hand.y]);

    const capture = await startCapture(page);
    await sleep(500);
    const T0 = now() + 0.05;
    const T = (t) => sleepUntil(T0 + t);
    const marks = { T0 };
    const mark = (name) => (marks[name] = now() - T0);
    const sfx = (name, arg, gain) => S('log', 'sfx', { name, arg, gain });

    const centre = async (selector, index = 0, { fx = 0.5, fy = 0.5 } = {}) => {
      const r = await S('rect', selector, index);
      if (!r) throw new Error(`no rect for ${selector}[${index}]`);
      return { x: r.x + r.w * fx + between(-3, 3), y: r.y + r.h * fy + between(-2, 2) };
    };
    const glide = async (selector, ms, index = 0, opts) => {
      const p = await centre(selector, index, opts);
      await hand.glideTo(p.x, p.y, ms);
    };
    // Re-centre on the target with a short corrective move, then press
    const pressOn = async (selector, index = 0) => {
      const r = await S('rect', selector, index);
      await hand.glideTo(r.x + r.w / 2, r.y + r.h / 2, 110);
      return hand.press();
    };
    const cardSel = (i) => `.card[data-index="${i}"]`;
    const glideCard = (i, ms) => glide(cardSel(i), ms, 0, { fx: 0.5, fy: 0.56 });
    // Board-size echo of the HUD's real "+100", rising off the pair's second card
    const plus100 = async (i) => {
      const r = await S('rect', cardSel(i));
      await S('pointsPop', r.x + r.w / 2, r.y + r.h * 0.3, '+100');
    };
    const key = async (k) => {
      await S('keyDown', k);
      await page.keyboard.press(k);
    };

    /* ---------- ACT 1 · Title screen (0-6 s) ----------
       Starts on the title screen itself (the poster still fades into the
       live page under a gentle CRT warm-up), then PRESS START, the menu with
       the Hall of Fame records, and START GAME. */
    await T(0.12);
    await S('warmUp');
    await T(0.95);
    await S('chipSet', 1, 'TITLE SCREEN');
    await T(1.15);
    await S('pointerOn', true);
    await glide('.landing-start', 700);
    await T(2.0);
    const start1 = await centre('.landing-start');
    await sfx('blip');
    await S('flash', start1.x, start1.y, { soft: true });
    marks.pressStart = (await hand.press(90)) - T0;
    await S('ready', '.difficulty-option');
    await T(2.45);
    await glide('.difficulty-option', 480, 0); // hover Easy (selected)
    await T(3.15);
    await glide('.difficulty-option', 420, 1); // hover Medium
    await T(4.3);
    await glide('.landing-actions .landing-start', 560);
    await T(5.0);
    const start2 = await centre('.landing-actions .landing-start');
    await sfx('press');
    await S('flash', start2.x, start2.y, { big: true });
    marks.startGame = (await hand.press(100)) - T0;

    /* ---------- ACT 2 · Board & arcade HUD (6-14 s) ----------
       The app's own preloader wobbles and fades into the board. One smooth
       camera move: ease in to 1.15x, a slow glide while the spotlight walks
       the HUD and the console toggles get pressed, ease back out. */
    await T(5.25);
    await hand.glideTo(1330, 690, 600);
    await S('pointerOn', false);
    await T(6.0);
    await S('chipSet', 2, 'ARCADE HUD');
    await S('ready', '.card[data-pokemon-id]');
    mark('board');
    await T(6.9);
    await sfx('whoosh', 1.4, 0.45);
    await S('camera', { s: 1.15, cx: 560, cy: 420, dur: 1.4, ease: 'cubic-bezier(0.45, 0, 0.55, 1)' });
    await T(7.55);
    await S('spotOn', '.hud-score', { pad: 8 });
    await T(7.7);
    // One label that follows the spotlight down the HUD, swapping its text
    await S('label', 'hud', '<b>SCORE</b> +100 MATCH · -20 MISS', { selector: '.hud-score', side: 'right', gap: 26 });
    await T(8.3);
    // A slow sideways glide (no vertical drift under the pointer's targets)
    await S('camera', { s: 1.15, cx: 720, cy: 420, dur: 4.2, ease: 'cubic-bezier(0.37, 0, 0.63, 1)' });
    await T(8.45);
    await S('spotOn', '.hud-stats > .hud-stat:nth-child(3)', { pad: 8 });
    await S('label', 'hud', '<b>TIME</b> MM:SS FROM YOUR FIRST FLIP', { selector: '.hud-stats > .hud-stat:nth-child(3)', side: 'right', gap: 26 });
    await T(9.25);
    await S('spotOn', '.hud-best', { pad: 8 });
    await S('label', 'hud', '<b>BEST</b> PER DIFFICULTY · SAVED LOCALLY', { selector: '.hud-best', side: 'right', gap: 26 });
    await T(10.0);
    await S('unpin', 'hud');
    await S('spotOn', '.game-controls .system-toggles', { pad: 10 });
    await hand.jump(760, 640);
    await S('pointerOn', true);
    await glide('.game-controls .sound-toggle', 450);
    await T(10.65);
    await sfx('blip');
    await pressOn('.game-controls .sound-toggle');
    await T(10.7);
    await S('label', 'sys', '<b>SFX</b> MUTE TOGGLE · REMEMBERED', { selector: '.game-controls .system-toggles', side: 'below', gap: 30 });
    await T(11.15);
    await sfx('blip');
    await pressOn('.game-controls .sound-toggle');
    await T(11.4);
    await glide('.game-controls .crt-toggle', 350);
    await T(11.85);
    await sfx('blip');
    await pressOn('.game-controls .crt-toggle');
    await S('label', 'sys', '<b>CRT</b> SCANLINE + VIGNETTE SHADER', { selector: '.game-controls .system-toggles', side: 'below', gap: 30 });
    await T(12.45);
    await sfx('blip');
    await pressOn('.game-controls .crt-toggle');
    // Both switches must end ON: a muted take would silently lose every game sound
    const switches = await page.evaluate(() =>
      [...document.getElementById('app').contentDocument.querySelectorAll('.game-controls [role="switch"]')].map((b) => b.getAttribute('aria-checked'))
    );
    if (switches.length !== 2 || switches.some((v) => v !== 'true')) throw new Error(`SFX/CRT toggles ended ${switches.join('/')}`);
    await T(12.6);
    await S('unpin', 'sys');
    await S('spotOff');
    await sfx('whoosh', 1.2, 0.4);
    await S('camera', { s: 1, dur: 1.2, ease: 'cubic-bezier(0.45, 0, 0.55, 1)' });

    /* ---------- ACT 3 · Tactile gameplay & juice (14-26 s) ---------- */
    await T(14.0);
    await S('chipSet', 3, 'GAMEPLAY');
    await T(14.35);
    await glideCard(card('pikachu', 0), 650);
    await T(15.1);
    marks.firstFlip = (await hand.press()) - T0;
    await T(15.35);
    await glideCard(card('charmander', 0), 500);
    await T(15.95);
    marks.mismatch = (await hand.press()) - T0;
    await T(17.15);
    await glideCard(card('pikachu', 0), 500);
    await T(17.75);
    await hand.press();
    await T(17.95);
    await glideCard(card('pikachu', 1), 650);
    await T(18.7);
    marks.matchPikachu = (await hand.press()) - T0;
    await T(18.85);
    await plus100(card('pikachu', 1));
    await T(19.9);
    await glideCard(card('gengar', 0), 650);
    await T(20.65);
    await hand.press();
    await T(20.85);
    await glideCard(card('gengar', 1), 500);
    await T(21.45);
    marks.matchGengar = (await hand.press()) - T0;
    await T(21.6);
    await plus100(card('gengar', 1));
    await S('streakPop', 2, 372, 612);
    await T(22.6);
    await glideCard(card('squirtle', 0), 500);
    await T(22.95);
    await S('streakBye');
    await T(23.2);
    await hand.press();
    await T(23.4);
    await glideCard(card('squirtle', 1), 450);
    await T(23.95);
    marks.matchSquirtle = (await hand.press()) - T0;
    await T(24.1);
    await plus100(card('squirtle', 1));
    await S('streakPop', 3, 372, 612);
    await T(25.55);
    await S('streakBye');

    /* ---------- ACT 4 · Under the hood & accessibility (26-33 s) ---------- */
    await T(26.0);
    await S('chipSet', 4, 'UNDER THE HOOD');
    await glideCard(card('bulbasaur', 0), 560);
    await T(26.65);
    marks.tripleClick = now() - T0;
    await hand.press(55);
    await sleep(70);
    await hand.press(55);
    await sleep(70);
    await hand.press(55);
    await T(26.8);
    await S('callout', 'guard', {
      x: 10,
      y: 140,
      cls: 'nes point-right',
      tag: 'PURE REDUCER',
      title: 'DOUBLE-CLICK GUARD',
      body: '<b>3 clicks</b> on a card, <b>1 flip</b>. A face-up card can never count twice.',
      code: 'if (clicked.flipped ||\n    clicked.matched)\n  return state;',
    });
    await T(27.35);
    await hand.glideTo(hand.x + 120, hand.y + 150, 380);
    await S('pointerOn', false);
    await S('keysOn', true, { x: 1201, y: 556 });
    await T(28.0);
    await key('ArrowDown');
    await T(28.1);
    await S('callout', 'keys', {
      x: 1160,
      y: 140,
      cls: 'nes point-left',
      tag: 'A11Y',
      title: 'ARROW-KEY PLAY',
      body: '<b>Arrows</b> move, <b>Enter</b> flips. A <b>dashed gold focus ring</b> marks the card.',
    });
    await T(28.5);
    await key('ArrowDown');
    await T(29.0);
    await key('Enter');
    mark('matchBulbasaur');
    await T(29.15);
    await plus100(card('bulbasaur', 1));
    await T(32.3);
    await S('keysOn', false);
    await T(32.5);
    await S('clearPins');

    /* ---------- ACT 5 · Handheld morph (33-39 s) ---------- */
    await T(33.0);
    await S('chipSet', 5, 'HANDHELD');
    await S('morph', 'handheld');
    const dev = await S('deviceRect');
    const rightX = Math.round(dev.x + dev.w + 56);
    await T(34.25);
    await S('callout', 'badge', {
      x: Math.round(dev.x - 56 - 312),
      y: 136,
      cls: 'badge',
      emoji: '📱',
      title: 'RESPONSIVE:',
      pixelBody: 'Live Breakpoint Reflow',
    });
    await T(34.6);
    await S('callout', 'dvh', {
      x: Math.round(dev.x - 56 - 252),
      y: 330,
      tag: 'CSS',
      title: '100dvh LAYOUT',
      body: 'Sized to the visible viewport: no jump when the browser bars slide.',
    });
    await T(34.9);
    await S('callout', 'touch', {
      x: rightX,
      y: 150,
      tag: 'TOUCH',
      title: 'TAP-READY',
      body: 'touch-action: manipulation, no double-tap zoom delay. 44px targets.',
    });
    await S('touch', true);
    await S('pointerOn', true);
    await T(35.4);
    {
      const p = await centre(cardSel(card('jigglypuff', 0)), 0, { fy: 0.56 });
      await hand.jump(p.x, p.y);
      await hand.press(80);
    }
    await T(36.15);
    {
      const p = await centre(cardSel(card('jigglypuff', 1)), 0, { fy: 0.56 });
      await hand.jump(p.x, p.y);
      marks.matchJigglypuff = (await hand.press(80)) - T0;
    }
    await T(36.3);
    await plus100(card('jigglypuff', 1));
    await T(37.4);
    await S('clearPins');
    await T(37.75);
    await S('touch', false);
    await S('pointerOn', false);
    await S('morph', 'desktop');

    /* ---------- ACT 6 · Hall of Fame & home again (39-45 s) ----------
       The final pair wins the game; after the win screen the pointer presses
       HOME, the app returns to the title screen and the reel settles on the
       frame it started on. */
    await T(39.0);
    await S('chipSet', 6, 'HALL OF FAME');
    {
      const p = await centre(cardSel(card('charmander', 0)), 0, { fy: 0.56 });
      await hand.jump(p.x + 160, p.y + 120);
    }
    await S('pointerOn', true);
    await glideCard(card('charmander', 0), 420);
    await T(39.55);
    await hand.press();
    await T(39.7);
    await glideCard(card('charmander', 1), 450);
    await T(40.25);
    marks.finalMatch = (await hand.press()) - T0;
    await S('ready', '.win-actions .win-btn');
    await T(40.55);
    {
      const home = await centre('.win-actions .win-btn', 1);
      await hand.glideTo(home.x + 230, home.y + 70, 900);
    }
    await T(42.85);
    await glide('.win-actions .win-btn', 550, 1);
    await T(43.5);
    {
      const home = await centre('.win-actions .win-btn', 1);
      await sfx('blip');
      await S('flash', home.x, home.y, { soft: true });
      marks.home = (await hand.press(90)) - T0;
    }
    await S('ready', '.landing-start');
    await T(43.6);
    await S('chipOff');
    await T(43.65);
    // Off the buttons (no hover state on the closing frames), then gone
    await hand.glideTo(1180, 470, 300);
    await S('pointerOn', false); // faded out before the closing dissolve
    await T(DURATION + 0.25);
    marks.end = now() - T0;
    await capture.stop();

    const events = await S('events');
    const finalLayout = await S('layout').catch(() => null);
    return { frames: capture.frames, events, marks, T0, finalLayout };
  } finally {
    await browser.close();
  }
}

/* ---------------------------------------------------------------- edit
   Output frame k shows the latest captured frame at or before T0 + k/30.
   The take starts after the head hold; the poster still covers frames before. */
function buildClip(frames, T0) {
  fs.rmSync(CLIP, { recursive: true, force: true });
  fs.mkdirSync(CLIP, { recursive: true });
  const first = Math.round(HEAD_HOLD * FPS);
  let j = 0;
  let gaps = 0;
  for (let k = first; k < TOTAL_FRAMES; k++) {
    const t = T0 + k / FPS;
    while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
    if (frames[j].t > t + 0.5 / FPS) gaps++;
    fs.linkSync(frames[j].file, path.join(CLIP, `${String(k).padStart(5, '0')}.jpg`));
  }
  return { first, gaps };
}

function render(first, audio) {
  const prep = `scale=${OUT_W}:${OUT_H}:flags=lanczos,format=gbrp,setsar=1,fps=${FPS},settb=1/${FPS}`;
  const parts = [
    `[0:v]${prep}[head]`,
    `[1:v]${prep}[take]`,
    `[2:v]${prep}[tail]`,
    // Poster still -> live title screen (under the CRT warm-up)
    `[head][take]xfade=transition=fade:duration=${HEAD_XFADE}:offset=${HEAD_HOLD},settb=1/${FPS}[body]`,
    // Live title screen after HOME -> the same still, held to the last frame
    `[body][tail]xfade=transition=fade:duration=${TAIL_XFADE}:offset=${TAIL_AT}[cut]`,
    `[cut]trim=end_frame=${TOTAL_FRAMES},setpts=PTS-STARTPTS,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]`,
  ];
  const inputs = [
    '-loop', '1', '-framerate', String(FPS), '-t', String(HEAD_HOLD + HEAD_XFADE + 0.1), '-i', POSTER_PNG,
    '-framerate', String(FPS), '-start_number', String(first), '-i', path.join(CLIP, '%05d.jpg'),
    '-loop', '1', '-framerate', String(FPS), '-t', '1.2', '-i', POSTER_PNG,
  ];
  /* Two-pass x264 at 1.6 Mb/s (VBV 2.8 Mb/s peak, 3.6 Mb buffer): enough for
     the animated anime-GIF backdrops under the CRT scanlines to stay clean
     through camera moves, about 9 MB in all.
     Loop seam: both ends are the poster still. They get 6x the bitrate
     (x264 zones) and the closing still starts on a forced keyframe, so the
     last frame is coded like the first and looping never "pops". */
  const headEnd = Math.round((HEAD_HOLD + HEAD_XFADE) * FPS) - 1;
  const tailStart = Math.round(TAIL_AT * FPS);
  const stillStart = Math.ceil((TAIL_AT + TAIL_XFADE) * FPS);
  const video = [
    '-frames:v', String(TOTAL_FRAMES),
    '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'animation',
    '-b:v', `${VIDEO_KBPS}k`, '-maxrate', `${VIDEO_MAXRATE}k`, '-bufsize', `${VIDEO_BUFSIZE}k`,
    '-x264-params', `zones=0,${headEnd},b=6/${tailStart},${TOTAL_FRAMES - 1},b=6`,
    '-force_key_frames', `expr:eq(n,${stillStart})`,
    '-profile:v', 'high', '-level', '4.1', '-g', '300', '-keyint_min', String(FPS), '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-passlogfile', path.join(WORK, 'x264'),
  ];
  const graph = ['-filter_complex', parts.join(';'), '-map', '[v]'];
  ffmpeg([...inputs, ...graph, ...video, '-pass', '1', '-an', '-f', 'null', '-']);
  ffmpeg([
    ...inputs,
    '-i', audio,
    ...graph,
    '-map', '3:a',
    ...video,
    '-pass', '2',
    '-c:a', 'aac', '-b:a', `${AUDIO_KBPS}k`, '-ar', '48000', '-ac', '2',
    '-t', String(DURATION),
    '-movflags', '+faststart', OUT_MP4,
  ]);
}

/* Measure EBU R128 loudness and true peak, then one linear gain toward
   -16 LUFS (web video). The mix is sparse (a quiet bed between the game's
   chimes), so its few chime transients would cap a purely linear gain far
   below target: a fast limiter may shave at most 2.5 dB off those peaks,
   holding samples under -2 dBFS (true peak about -1.5 dBTP after AAC). */
const LOUDNESS = { target: -16, ceiling: -2, maxLimit: 2.5, truePeak: -1.5 };

function loudness(file) {
  const log = ffmpeg(['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { level: 'info' });
  const value = (re) => Number(log.match(re)?.pop()?.match(/-?[\d.]+/)?.[0]);
  const I = value(/I:\s+-?[\d.]+ LUFS/g);
  const TP = value(/Peak:\s+-?[\d.]+ dBFS/g);
  if (!Number.isFinite(I) || !Number.isFinite(TP)) throw new Error(`could not measure the loudness of ${file}`);
  return { I, TP };
}

function normalise(input, output) {
  const before = loudness(input);
  const limit = 10 ** (LOUDNESS.ceiling / 20);
  const apply = (g) => {
    ffmpeg([
      '-i', input,
      '-af', `volume=${g.toFixed(2)}dB,alimiter=limit=${limit.toFixed(4)}:attack=4:release=80:level=0`,
      '-c:a', 'pcm_f32le', output,
    ]);
    return loudness(output);
  };
  let gain = Math.min(LOUDNESS.target - before.I, LOUDNESS.ceiling - before.TP + LOUDNESS.maxLimit);
  let after = apply(gain);
  // The limiter holds sample peaks; inter-sample (true) peaks can still poke
  // above the ceiling, so trim the gain by the overshoot and redo it once.
  if (after.TP > LOUDNESS.truePeak) {
    gain -= after.TP - LOUDNESS.truePeak + 0.2;
    after = apply(gain);
  }
  return { ...before, gain, after };
}

/* Turn the take's event log into soundtrack cues (seconds of reel time). */
function cuesFrom(events, T0, marks) {
  const cues = [];
  const rel = (e) => e.t / 1000 - T0;
  for (const e of events) {
    const t = rel(e);
    if (t < 0 || t > DURATION) continue;
    switch (e.type) {
      case 'audio':
        if (/card_match/.test(e.src)) cues.push({ t, kind: 'match' });
        else if (/victory/.test(e.src)) cues.push({ t, kind: 'victory' });
        break;
      case 'audio-pause':
        // e.g. leaving the board silences the victory theme (Game's unmount)
        if (/card_match/.test(e.src)) cues.push({ t, kind: 'stop', of: 'match' });
        else if (/victory/.test(e.src)) cues.push({ t, kind: 'stop', of: 'victory' });
        break;
      case 'buzz':
        cues.push({ t, kind: 'buzz' });
        break;
      case 'warm-up':
        cues.push({ t, kind: 'warmUp' });
        break;
      case 'sfx':
        cues.push({ t, kind: e.name, arg: e.arg ?? undefined, gain: e.gain ?? undefined });
        break;
      case 'streak':
        cues.push({ t, kind: 'streak', arg: e.n });
        break;
      case 'key':
        cues.push({ t, kind: 'key' });
        break;
      case 'tap':
        cues.push({ t, kind: 'tap' });
        break;
      case 'morph':
        cues.push({ t, kind: 'whoosh', arg: 1.25, gain: 0.75 });
        break;
      default:
        break;
    }
  }
  // Headless audio can refuse to start an AudioContext; the buzz still belongs on the mismatch
  if (!cues.some((c) => c.kind === 'buzz') && marks.mismatch) {
    console.warn('note: no AudioContext buzz was logged; placing the mismatch buzz on the mismatch click');
    cues.push({ t: marks.mismatch + 0.02, kind: 'buzz' });
  }
  return cues.sort((a, b) => a.t - b.t);
}

function probe(file) {
  const res = spawnSync(ffmpegPath, ['-hide_banner', '-i', file, '-map', '0:v:0', '-c', 'copy', '-f', 'null', '-'], { encoding: 'utf8' });
  const err = res.stderr;
  const frames = Number(err.match(/frame=\s*(\d+)/g)?.pop()?.match(/\d+/)?.[0] ?? NaN);
  const duration = err.match(/Duration: ([\d:.]+)/)?.[1];
  const video = err.match(/Stream #0:\d.*Video: (.*)/)?.[1];
  const audio = err.match(/Stream #0:\d.*Audio: (.*)/)?.[1];
  return { frames, duration, video, audio };
}

/* ---------------------------------------------------------------- main */
async function main() {
  const t0 = now();
  await fsp.mkdir(OUT, { recursive: true });
  let take;

  if (REENCODE) {
    // Re-cut and re-encode the take kept by an earlier --keep run
    const saved = JSON.parse(await fsp.readFile(path.join(WORK, 'take.json'), 'utf8'));
    take = {
      frames: saved.frames.map((t, i) => ({ t, file: path.join(FRAMES, `${String(i).padStart(6, '0')}.jpg`) })),
      events: saved.events,
      marks: saved.marks,
      T0: saved.marks.T0,
    };
  } else {
    await fsp.rm(WORK, { recursive: true, force: true });
    await fsp.mkdir(WORK, { recursive: true });
    console.log('building the app…');
    buildApp();
    await ensureSprites();

    const server = await serve();
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
      console.log('recording…');
      take = await record(base);
    } finally {
      server.close();
      // Never leave a built bundle where the app's ESLint would find it
      await fsp.rm(APP_DIST, { recursive: true, force: true });
    }
  }
  const { frames, events, marks, T0 } = take;
  await fsp.writeFile(path.join(WORK, 'take.json'), JSON.stringify({ marks, events, frames: frames.map((f) => f.t) }, null, 1));
  const inTake = frames.filter((f) => f.t >= T0 && f.t <= T0 + DURATION);
  console.log(`captured ${frames.length} frames; ${(inTake.length / DURATION).toFixed(1)} fps inside the reel window`);
  const late = Object.entries(marks)
    .filter(([k, v]) => k !== 'T0' && typeof v === 'number')
    .map(([k, v]) => `${k}=${v.toFixed(2)}s`)
    .join(' ');
  console.log(`marks: ${late}`);

  const { first, gaps } = buildClip(frames, T0);
  if (gaps) console.log(`note: ${gaps} output frames repeat an earlier capture (no new paint)`);

  const cues = cuesFrom(events, T0, marks);
  // Six matches (the last one also starts the victory theme): anything else
  // means the app was muted or a click missed, and the take is not usable.
  const count = (kind) => cues.filter((c) => c.kind === kind).length;
  if (count('match') !== 6 || count('victory') !== 1) {
    throw new Error(`take is missing game sounds (match x${count('match')}, victory x${count('victory')}): was SFX left off?`);
  }
  console.log(`sound cues: ${cues.map((c) => `${c.kind}@${c.t.toFixed(2)}`).join(' ')}`);
  const victory = cues.find((c) => c.kind === 'victory');
  buildSoundtrack({
    ffmpegPath,
    cues,
    duration: DURATION,
    sounds: SOUNDS,
    outFile: SOUNDTRACK,
    // The bed eases in after the warm-up and bows out before the victory theme
    bed: {
      from: 0.85,
      fadeIn: 0.6,
      to: (victory?.t ?? 40.3) - 0.9,
      fadeOut: (victory?.t ?? 40.3) - 2.6,
      layers: (t) => ({ drums: t >= 6.0, snare: t >= 14.0 }),
    },
  });
  const loud = normalise(SOUNDTRACK, SOUNDTRACK_NORM);
  console.log(
    `soundtrack: ${loud.I.toFixed(1)} LUFS / ${loud.TP.toFixed(1)} dBTP in, ${loud.gain >= 0 ? '+' : ''}${loud.gain.toFixed(1)} dB -> ` +
      `${loud.after.I.toFixed(1)} LUFS / ${loud.after.TP.toFixed(1)} dBTP`
  );

  render(first, SOUNDTRACK_NORM);
  ffmpeg(['-i', POSTER_PNG, '-c:v', 'libwebp', '-quality', '90', '-compression_level', '6', '-preset', 'picture', OUT_POSTER]);
  // Lossless poster master (alpha dropped, best PNG prediction): the portfolio card thumbnail
  ffmpeg(['-i', POSTER_PNG, '-pix_fmt', 'rgb24', '-pred', 'mixed', '-compression_level', '100', OUT_POSTER_PNG]);

  const info = probe(OUT_MP4);
  const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(2);
  const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0);
  console.log(`reel: ${info.frames} frames, ${info.duration}, ${mb(OUT_MP4)} MB -> ${path.relative(ROOT, OUT_MP4)}`);
  console.log(`      ${info.video}`);
  console.log(`      ${info.audio}`);
  console.log(`poster: ${kb(OUT_POSTER)} KB -> ${path.relative(ROOT, OUT_POSTER)}`);
  console.log(`        ${kb(OUT_POSTER_PNG)} KB -> ${path.relative(ROOT, OUT_POSTER_PNG)}`);
  if (info.frames !== TOTAL_FRAMES) throw new Error(`expected ${TOTAL_FRAMES} frames, got ${info.frames}`);

  if (!KEEP && !REENCODE) await fsp.rm(WORK, { recursive: true, force: true });
  console.log(`done in ${(now() - t0).toFixed(0)} s`);
}

/* Shared with readme-media.mjs: the README screenshots use the same build,
   demo data and seeded deal as the reel. */
export {
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
};

// Record only when run directly (npm run record), not when imported.
const isEntry = (() => {
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isEntry) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
