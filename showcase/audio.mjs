/* ==========================================================================
   Soundtrack for the showcase reel, built from the take's event log.

   In-game sounds are the app's own: card_match.mp3 and the victory theme
   (decoded from src/assets/sounds, same 0.6 volume, and one <audio> element
   per sound, so a new match restarts the chime exactly like the app does),
   plus the mismatch buzz re-synthesised with the parameters in
   src/audio/SoundProvider.jsx. Everything else is the reel's own sound
   design, synthesised here: CRT warm-up, UI blips, key ticks, whooshes and
   an original 8-bit bed that ducks under the game.
   ========================================================================== */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export const SR = 48000;
const TAU = Math.PI * 2;

/* ---------------------------------------------------------------- oscillators */
const midi = (m) => 440 * 2 ** ((m - 69) / 12);

function polyBlep(t, dt) {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

/** Band-limited pulse wave (PolyBLEP), so high notes don't alias into fizz. */
function pulse(seconds, freq, { duty = 0.5, amp = 1, env = () => 1 } = {}) {
  const n = Math.max(1, Math.round(seconds * SR));
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = typeof freq === 'function' ? freq(t) : freq;
    const dt = Math.min(0.5, f / SR);
    let v = ph < duty ? 1 : -1;
    v += polyBlep(ph, dt);
    v -= polyBlep((ph - duty + 1) % 1, dt);
    out[i] = v * amp * env(t, seconds);
    ph += dt;
    if (ph >= 1) ph -= 1;
  }
  return out;
}

/** NES-flavoured triangle: 16-step quantised, like the 2A03's 4-bit DAC. */
function triangle(seconds, freq, { amp = 1, env = () => 1 } = {}) {
  const n = Math.max(1, Math.round(seconds * SR));
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = typeof freq === 'function' ? freq(t) : freq;
    const tri = ph < 0.5 ? ph * 4 - 1 : 3 - ph * 4;
    out[i] = (Math.round(tri * 7.5) / 7.5) * amp * env(t, seconds);
    ph += f / SR;
    if (ph >= 1) ph -= 1;
  }
  return out;
}

function sine(seconds, freq, { amp = 1, env = () => 1 } = {}) {
  const n = Math.max(1, Math.round(seconds * SR));
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = typeof freq === 'function' ? freq(t) : freq;
    out[i] = Math.sin(ph * TAU) * amp * env(t, seconds);
    ph += f / SR;
    if (ph >= 1) ph -= 1;
  }
  return out;
}

/** Seeded white noise with optional one-pole low/high-pass (Hz, may vary over time). */
function noise(seconds, { amp = 1, env = () => 1, lp, hp, seed = 7 } = {}) {
  const n = Math.max(1, Math.round(seconds * SR));
  const out = new Float32Array(n);
  let s = seed >>> 0;
  let low = 0;
  let prevIn = 0;
  let high = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    let v = s / 2147483648 - 1;
    if (lp) {
      const c = typeof lp === 'function' ? lp(t) : lp;
      const a = 1 - Math.exp((-TAU * c) / SR);
      low += a * (v - low);
      v = low;
    }
    if (hp) {
      const c = typeof hp === 'function' ? hp(t) : hp;
      const a = 1 / (1 + (TAU * c) / SR);
      high = a * (high + v - prevIn);
      prevIn = v;
      v = high;
    }
    out[i] = v * amp * env(t, seconds);
  }
  return out;
}

/* Envelopes: t (s) since note start, d = note length */
const decay = (tau, attack = 0.002) => (t) => Math.min(1, t / attack) * Math.exp(-t / tau);
const gate = (attack = 0.003, release = 0.012) => (t, d) => Math.min(1, t / attack, Math.max(0, (d - t) / release));

function sum(...parts) {
  const n = Math.max(...parts.map(([buf, at = 0]) => Math.round(at * SR) + buf.length));
  const out = new Float32Array(n);
  for (const [buf, at = 0] of parts) {
    const o = Math.round(at * SR);
    for (let i = 0; i < buf.length; i++) out[o + i] += buf[i];
  }
  return out;
}

/* ---------------------------------------------------------------- sound effects */
const SFX = {
  /** The app's mismatch buzz (SoundProvider.buzz): square 196 -> 82 Hz, 0.25 s. */
  buzz() {
    const ramp = (t) => 196 * (82 / 196) ** Math.min(1, t / 0.22);
    const env = (t) => {
      if (t < 0.015) return 0.0001 * (0.07 / 0.0001) ** (t / 0.015);
      return 0.07 * (0.0001 / 0.07) ** Math.min(1, (t - 0.015) / 0.225);
    };
    // The app plays it at a whisper (0.07 peak) next to its 0.6-volume MP3s;
    // x4.5 lets it read over the bed while staying under the match chime.
    return pulse(0.25, ramp, { duty: 0.5, amp: 4.5, env });
  },

  blip() {
    return sum(
      [pulse(0.05, midi(88), { duty: 0.25, amp: 0.16, env: decay(0.03) })],
      [pulse(0.07, midi(95), { duty: 0.25, amp: 0.14, env: decay(0.04) }), 0.045]
    );
  },

  /** START GAME: a little arcade "coin-up" run with a felt thud underneath. */
  press() {
    const notes = [72, 79, 84, 88, 91];
    const parts = notes.map((m, i) => [pulse(i === notes.length - 1 ? 0.24 : 0.05, midi(m), { duty: 0.5, amp: 0.09, env: i === notes.length - 1 ? decay(0.09) : gate() }), i * 0.042]);
    parts.push([triangle(0.12, (t) => 150 - 400 * t, { amp: 0.25, env: decay(0.05) })]);
    return sum(...parts);
  },

  /** Gentle CRT warm-up: a soft mains hum swelling in, a breath of static
      and a faint rising tone, all under a second and kept low. */
  warmUp() {
    const swell = (t, d) => Math.sin(Math.PI * Math.min(1, t / d)) ** 1.6;
    return sum(
      [sine(1.2, (t) => 52 + 8 * t, { amp: 0.12, env: swell })],
      [sine(1.2, 104, { amp: 0.028, env: swell })],
      [noise(0.9, { amp: 0.028, lp: 3800, hp: 700, seed: 31, env: (t) => Math.min(1, t / 0.12) * Math.exp(-t / 0.32) }), 0.04],
      [pulse(0.55, (t) => 320 * 2 ** (t / 0.55), { duty: 0.25, amp: 0.011, env: gate(0.08, 0.25) }), 0.22]
    );
  },

  whoosh(seconds = 0.7) {
    return noise(seconds, {
      amp: 0.18,
      seed: 23,
      lp: (t) => 300 + 2600 * Math.sin(Math.PI * Math.min(1, t / seconds)),
      env: (t) => Math.sin(Math.PI * Math.min(1, t / seconds)) ** 2,
    });
  },

  streak(n = 2) {
    const base = n >= 3 ? [81, 85, 88, 93] : [79, 83, 86, 91];
    const parts = base.map((m, i) => [pulse(0.05, midi(m), { duty: 0.25, amp: 0.1, env: gate() }), i * 0.045]);
    parts.push([pulse(0.26, (t) => midi(base[3]) * (1 + 0.012 * Math.sin(t * 60)), { duty: 0.25, amp: 0.1, env: decay(0.1) }), 0.18]);
    parts.push([pulse(0.05, midi(base[3] + 12), { duty: 0.125, amp: 0.04, env: decay(0.03) }), 0.24]);
    return sum(...parts);
  },

  key() {
    return sum(
      [pulse(0.016, 1760, { duty: 0.5, amp: 0.2, env: decay(0.008) })],
      [noise(0.012, { amp: 0.25, env: decay(0.004), hp: 3000, seed: 5 })]
    );
  },

  tap() {
    return sine(0.06, (t) => 1000 - 9000 * t, { amp: 0.4, env: decay(0.02, 0.001) });
  },
};

/* ---------------------------------------------------------------- 8-bit bed
   150 BPM (a 16th note is exactly 0.1 s), I-vi-IV-V in C. Pulse arpeggio,
   triangle octave bass, noise drums; layers join as the reel builds. */
const STEP = 0.1;
const CHORDS = [
  { root: 48, tones: [72, 76, 79, 84] }, // C
  { root: 45, tones: [69, 72, 76, 81] }, // Am
  { root: 41, tones: [65, 69, 72, 77] }, // F
  { root: 43, tones: [67, 71, 74, 79] }, // G
];

function renderBed(L, R, { from, to, fadeIn = 0.12, fadeOut, layers }) {
  const steps = Math.floor((to - from) / STEP);
  const put = (buf, at, gl = 1, gr = 1) => {
    const o = Math.round(at * SR);
    for (let i = 0; i < buf.length && o + i < L.length; i++) {
      L[o + i] += buf[i] * gl;
      R[o + i] += buf[i] * gr;
    }
  };
  const arpNote = new Map();
  const hat = noise(0.03, { amp: 0.02, env: decay(0.01), hp: 7000, seed: 41 });
  const snare = sum([noise(0.13, { amp: 0.05, env: decay(0.04), hp: 1200, lp: 9000, seed: 17 })], [triangle(0.05, 210, { amp: 0.05, env: decay(0.02) })]);
  const kick = triangle(0.11, (t) => 160 * (42 / 160) ** Math.min(1, t / 0.08), { amp: 0.17, env: decay(0.05, 0.001) });

  for (let k = 0; k < steps; k++) {
    const t = from + k * STEP;
    const chord = CHORDS[Math.floor(k / 16) % CHORDS.length];
    const s = k % 16;
    const lay = layers(t);
    // Arp: 16ths up the chord
    const m = chord.tones[s % 4];
    if (!arpNote.has(m)) arpNote.set(m, pulse(0.085, midi(m), { duty: 0.125, amp: 0.02, env: gate(0.002, 0.03) }));
    put(arpNote.get(m), t, 0.8, 1);
    // Bass: octave-bounce 8ths
    if (s % 2 === 0) {
      const b = chord.root + (s % 4 === 0 ? 0 : 12);
      put(triangle(0.18, midi(b), { amp: 0.08, env: gate(0.003, 0.03) }), t);
    }
    if (lay.drums && (s === 0 || s === 8)) put(kick, t);
    if (lay.drums && (s === 2 || s === 6 || s === 10 || s === 14)) put(hat, t, 1, 0.75);
    if (lay.snare && (s === 4 || s === 12)) put(snare, t);
  }
  // Fades
  const a = Math.round(from * SR);
  const fi = Math.round(fadeIn * SR);
  for (let i = 0; i < fi; i++) {
    const g = Math.sin(((i / fi) * Math.PI) / 2) ** 2;
    L[a + i] *= g;
    R[a + i] *= g;
  }
  const f0 = Math.round(fadeOut * SR);
  const f1 = Math.round(to * SR);
  for (let i = f0; i < L.length; i++) {
    const g = i >= f1 ? 0 : Math.cos(((i - f0) / (f1 - f0)) * (Math.PI / 2)) ** 2;
    L[i] *= g;
    R[i] *= g;
  }
}

/* ---------------------------------------------------------------- mixing */
function decode(ffmpegPath, file) {
  const res = spawnSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-i', file, '-map', '0:a:0', '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 });
  if (res.status !== 0) throw new Error(`could not decode ${file}: ${res.stderr}`);
  const f = new Float32Array(res.stdout.buffer, res.stdout.byteOffset, res.stdout.byteLength / 4);
  const L = new Float32Array(f.length / 2);
  const R = new Float32Array(f.length / 2);
  for (let i = 0; i < L.length; i++) {
    L[i] = f[i * 2];
    R[i] = f[i * 2 + 1];
  }
  return { L, R };
}

function writeWav(file, L, R) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 8);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 8, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(3, 20); // IEEE float
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 8, 28);
  buf.writeUInt16LE(8, 32);
  buf.writeUInt16LE(32, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) {
    buf.writeFloatLE(L[i], 44 + i * 8);
    buf.writeFloatLE(R[i], 48 + i * 8);
  }
  fs.writeFileSync(file, buf);
}

/**
 * cues: [{ t (s, reel time), kind, ... }] where kind is one of
 *   match | victory   the app's MP3s   (one element each: a replay restarts it)
 *   stop              the app paused that element ({ of: 'match' | 'victory' }),
 *                     e.g. leaving the board silences the victory theme
 *   buzz              the app's mismatch buzz
 *   any SFX name      warmUp, blip, press, whoosh, streak, key, tap
 */
export function buildSoundtrack({ ffmpegPath, cues, duration, sounds, outFile, bed }) {
  const n = Math.round(duration * SR);
  const app = { L: new Float32Array(n), R: new Float32Array(n) };
  const fxBus = { L: new Float32Array(n), R: new Float32Array(n) };
  const bedBus = { L: new Float32Array(n), R: new Float32Array(n) };

  const add = (bus, src, at, gain = 1, until = Infinity, fadeSec = 0.012) => {
    const o = Math.round(at * SR);
    const stop = Math.min(src.L ? src.L.length : src.length, Math.round((until - at) * SR));
    const fade = Math.round(fadeSec * SR);
    for (let i = 0; i < stop && o + i < n; i++) {
      if (o + i < 0) continue;
      const g = gain * (stop - i < fade ? (stop - i) / fade : 1);
      bus.L[o + i] += (src.L ? src.L[i] : src[i]) * g;
      bus.R[o + i] += (src.R ? src.R[i] : src[i]) * g;
    }
  };

  // The app's MP3 elements: a replay restarts one (currentTime = 0) and a
  // pause() stops it, so each play lasts until whichever comes first.
  const decoded = {};
  for (const kind of ['match', 'victory']) {
    const list = cues.filter((c) => c.kind === kind).sort((a, b) => a.t - b.t);
    if (!list.length) continue;
    const stops = cues.filter((c) => c.kind === 'stop' && c.of === kind).map((c) => c.t);
    decoded[kind] = decoded[kind] || decode(ffmpegPath, sounds[kind]);
    list.forEach((c, i) => {
      const next = i + 1 < list.length ? list[i + 1].t : Infinity;
      const paused = Math.min(Infinity, ...stops.filter((t) => t > c.t));
      add(app, decoded[kind], c.t, 0.6, Math.min(next, paused), paused < next ? 0.08 : 0.012);
    });
  }

  for (const c of cues) {
    if (c.kind === 'match' || c.kind === 'victory' || c.kind === 'stop') continue;
    const make = SFX[c.kind];
    if (!make) throw new Error(`unknown sound cue: ${c.kind}`);
    const bus = c.kind === 'buzz' ? app : fxBus;
    add(bus, make(c.arg), c.t, c.gain ?? 1);
  }

  if (bed) renderBed(bedBus.L, bedBus.R, bed);

  // Duck the bed under the game's own sounds (fast attack, slow release)
  let envl = 0;
  const att = 1 - Math.exp(-1 / (0.012 * SR));
  const rel = 1 - Math.exp(-1 / (0.35 * SR));
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const lvl = Math.max(Math.abs(app.L[i]), Math.abs(app.R[i]));
    envl += (lvl > envl ? att : rel) * (lvl - envl);
    const duck = 1 - 0.72 * Math.min(1, envl / 0.12);
    L[i] = bedBus.L[i] * duck + fxBus.L[i] + app.L[i];
    R[i] = bedBus.R[i] * duck + fxBus.R[i] + app.R[i];
  }
  // 4 ms fade at both ends so the loop point never clicks
  const edge = Math.round(0.004 * SR);
  for (let i = 0; i < edge; i++) {
    const g = i / edge;
    L[i] *= g;
    R[i] *= g;
    L[n - 1 - i] *= g;
    R[n - 1 - i] *= g;
  }
  writeWav(outFile, L, R);
  return outFile;
}
