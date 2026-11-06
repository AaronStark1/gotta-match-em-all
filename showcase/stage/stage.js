/* ==========================================================================
   Showcase stage API (window.stage), driven cue by cue from
   record-showcase.mjs. The real app runs untouched in #app; this file only
   moves the camera, draws the broadcast layer and keeps an event log
   (window.__ev) that the recorder turns into the soundtrack.
   ========================================================================== */
(() => {
  const $ = (selector) => document.querySelector(selector);
  const app = $("#app");
  const screenEl = $("#screen");
  const rig = $("#rig");
  const rigFx = $("#rig-fx");
  const warm = $("#warm");
  const fx = $("#fx");
  const pointer = $("#pointer");
  const spot = $("#spot");
  const chip = $("#chip");
  const keys = $("#keys");
  const streak = $("#streak");
  const backdrop = $("#backdrop");

  const W = 1440;
  const H = 810;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const clock = () => performance.timeOrigin + performance.now();
  const events = (window.__ev = window.__ev || []);
  const log = (type, data = {}) => {
    const entry = { type, t: clock(), ...data };
    events.push(entry);
    return entry;
  };

  /* Sparkles on the handheld backdrop */
  [
    [9, 16], [18, 72], [27, 34], [72, 20], [83, 64], [91, 30], [12, 48], [88, 84], [64, 88], [36, 86],
  ].forEach(([x, y], i) => {
    const s = document.createElement("i");
    s.style.left = `${x}%`;
    s.style.top = `${y}%`;
    s.style.animationDelay = `${(i * 0.37) % 2.4}s`;
    backdrop.appendChild(s);
  });

  /* ---------------------------------------------------------------- app frame */
  const doc = () => app.contentDocument;

  function load(path) {
    return new Promise((resolve) => {
      app.addEventListener("load", () => resolve(true), { once: true });
      app.src = path;
    });
  }

  async function ready(selector, timeout = 30000) {
    const start = performance.now();
    for (;;) {
      const d = doc();
      if (d && d.querySelector(selector)) break;
      if (performance.now() - start > timeout) throw new Error(`stage: ${selector} never appeared`);
      await new Promise((r) => setTimeout(r, 25));
    }
    await doc().fonts.ready;
    await Promise.all([document.fonts.load('12px "Press Start 2P"'), document.fonts.load('22px "VT323"')]);
    return true;
  }

  /* App-viewport rect of an element inside the app (CSS px of the iframe). */
  function appRect(selector, index = 0) {
    const el = doc().querySelectorAll(selector)[index];
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height };
  }

  /* The same rect in stage coordinates, as currently rendered (camera, morph). */
  function rect(selector, index = 0) {
    const r = appRect(selector, index);
    if (!r) return null;
    const f = app.getBoundingClientRect();
    const k = f.width / app.clientWidth;
    return { x: f.left + r.x * k, y: f.top + r.y * k, w: r.w * k, h: r.h * k };
  }

  /* Board layout: Pokédex number of every card, in DOM (= grid) order. */
  function layout() {
    return [...doc().querySelectorAll(".card[data-index]")].map((el) => Number(el.dataset.pokemonId));
  }

  /* ---------------------------------------------------------------- camera
     The rig zooms/pans with a CSS transition, so the compositor animates it
     and rasterises the app at the zoomed scale (stays crisp). */
  function camera({ s = 1, cx, cy, dur = 0.9, ease } = {}) {
    let x = 0;
    let y = 0;
    if (cx !== undefined) {
      x = clamp(W / 2 - cx * s, W - W * s, 0);
      y = clamp(H / 2 - cy * s, H - H * s, 0);
    }
    rig.style.setProperty("--cam-dur", `${dur}s`);
    rig.style.setProperty("--cam-ease", ease || "cubic-bezier(0.65, 0, 0.35, 1)");
    rig.style.transform = s === 1 && x === 0 && y === 0 ? "" : `translate(${x}px, ${y}px) scale(${s})`;
    log("camera", { s, dur });
    return { s, x, y };
  }

  /* ---------------------------------------------------------------- spotlight */
  function spotOn(selector, { pad = 8, index = 0 } = {}) {
    const r = appRect(selector, index);
    const box = { left: `${r.x - pad}px`, top: `${r.y - pad}px`, width: `${r.w + pad * 2}px`, height: `${r.h + pad * 2}px` };
    if (!spot.classList.contains("on")) {
      // First target: jump there, then fade in (no fly-in from the corner)
      spot.style.transition = "opacity 0.4s ease";
      Object.assign(spot.style, box);
      void spot.offsetWidth;
      spot.style.transition = "";
      spot.classList.add("on");
    } else {
      Object.assign(spot.style, box);
    }
    log("spot", { selector });
  }

  function spotOff() {
    spot.classList.remove("on");
  }

  /* ---------------------------------------------------------------- labels & callouts */
  const pins = new Map();

  /* Re-pinning an id keeps the element (and its visible state), so a label
     can slide to its next target and swap text instead of cross-fading. */
  function pin(id, html, cls, layer = fx) {
    let el = pins.get(id);
    const wasOn = Boolean(el && el.classList.contains("on"));
    if (!el) {
      el = document.createElement("div");
      layer.appendChild(el);
      pins.set(id, el);
    }
    el.className = wasOn ? `${cls} on` : cls;
    el.innerHTML = html;
    return el;
  }

  function show(el) {
    void el.offsetWidth;
    requestAnimationFrame(() => el.classList.add("on"));
  }

  function unpin(id) {
    const el = pins.get(id);
    if (!el) return;
    pins.delete(id);
    el.classList.remove("on");
    el.classList.add("out");
    setTimeout(() => el.remove(), 400);
  }

  function clearPins() {
    [...pins.keys()].forEach(unpin);
  }

  /* One-line label beside an app element, in app coordinates inside the
     rig, so it rides the camera glide with its target.
     side: right | left | below */
  function label(id, html, { selector, side = "right", gap = 22, dy = 0 }) {
    const r = appRect(selector);
    const el = pin(id, html, `label${side === "left" ? " right" : side === "below" ? " up" : ""}`, rigFx);
    const lw = el.offsetWidth;
    const lh = el.offsetHeight;
    let x = r.x + r.w + gap;
    let y = r.y + r.h / 2 - lh / 2 + dy;
    if (side === "left") x = r.x - gap - lw;
    if (side === "below") {
      x = r.x;
      y = r.y + r.h + gap + dy;
    }
    el.style.left = `${Math.round(clamp(x, 16, W - lw - 16))}px`;
    el.style.top = `${Math.round(clamp(y, 16, H - lh - 16))}px`;
    show(el);
    log("label", { id });
  }

  function callout(id, { x, y, w, cls = "", tag, title, emoji, body, code, pixelBody }) {
    const parts = [];
    if (tag) parts.push(`<span class="tag">${tag}</span>`);
    if (title) parts.push(`<h3>${emoji ? `<span class="emoji">${emoji}</span>` : ""}<span>${title}</span></h3>`);
    if (body) parts.push(`<p>${body}</p>`);
    if (pixelBody) parts.push(`<p>${pixelBody}</p>`);
    if (code) parts.push(`<code>${code}</code>`);
    const el = pin(id, parts.join(""), `callout ${cls}`.trim());
    if (w) el.style.width = `${w}px`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    show(el);
    log("callout", { id });
  }

  /* ---------------------------------------------------------------- act chip */
  function chipSet(n, text) {
    const apply = () => {
      chip.querySelector(".n").textContent = String(n).padStart(2, "0");
      chip.querySelector(".l").textContent = text;
      chip.classList.add("on");
    };
    if (chip.classList.contains("on")) {
      chip.classList.remove("on");
      setTimeout(apply, 320);
    } else {
      apply();
    }
    log("chip", { n });
  }

  function chipOff() {
    chip.classList.remove("on");
  }

  /* ---------------------------------------------------------------- flourishes */
  function warmUp() {
    warm.classList.remove("on");
    void warm.offsetWidth;
    warm.classList.add("on");
    log("warm-up");
  }

  function flash(x, y, { big = false, soft = false } = {}) {
    const glow = document.createElement("div");
    glow.className = `flash${big ? " big" : ""}${soft ? " soft" : ""}`;
    glow.style.setProperty("--x", `${x}px`);
    glow.style.setProperty("--y", `${y}px`);
    fx.appendChild(glow);
    if (big) {
      const rays = document.createElement("div");
      rays.className = "flash-rays";
      rays.style.setProperty("--x", `${x}px`);
      rays.style.setProperty("--y", `${y}px`);
      fx.appendChild(rays);
      setTimeout(() => rays.remove(), 900);
    }
    setTimeout(() => glow.remove(), 900);
    log("flash", { big });
  }

  /* "+100" rising off a matched pair (stage coordinates) */
  function pointsPop(x, y, text = "+100") {
    const el = document.createElement("div");
    el.className = "points";
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    fx.appendChild(el);
    setTimeout(() => el.remove(), 1300);
    log("points", { text });
  }

  function streakPop(n, x, y) {
    streak.querySelector(".word").innerHTML = `STREAK ×${n}! <span class="fire">🔥</span>`;
    streak.querySelector(".sub").textContent = `${n} MATCHES IN A ROW`;
    streak.style.left = `${x}px`;
    streak.style.top = `${y}px`;
    streak.classList.remove("pop", "bye");
    void streak.offsetWidth;
    streak.classList.add("pop");
    log("streak", { n });
  }

  function streakBye() {
    streak.classList.remove("pop");
    streak.classList.add("bye");
  }

  function keysOn(on = true, at) {
    if (at) {
      keys.style.left = `${at.x}px`;
      keys.style.top = `${at.y}px`;
    }
    keys.classList.toggle("on", on);
  }

  function keyDown(key) {
    const cap = keys.querySelector(`[data-key="${key}"]`);
    if (cap) {
      cap.classList.add("down");
      setTimeout(() => cap.classList.remove("down"), 150);
    }
    log("key", { key });
  }

  /* ---------------------------------------------------------------- pointer
     Headless Chromium paints no cursor. Mouse events over the iframe never
     reach this document, so the app frame forwards them (see the recorder's
     init script) already mapped to stage coordinates, with the cursor the
     app's CSS asks for there (Poké Ball pointer over clickables). */
  let pointerHidden = true;
  let touchMode = false;

  function ripple(x, y) {
    const r = document.createElement("div");
    r.className = `ripple${touchMode ? " touch" : ""}`;
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    document.getElementById("stage").appendChild(r);
    setTimeout(() => r.remove(), 600);
  }

  window.__stagePointer = (type, x, y, kind) => {
    pointer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    pointer.dataset.kind = touchMode ? "touch" : kind;
    if (!pointerHidden) pointer.classList.add("on");
    if (type === "down") {
      pointer.classList.add("down");
      ripple(x, y);
      log(touchMode ? "tap" : "down", { x, y });
    } else if (type === "up") {
      pointer.classList.remove("down");
    }
  };

  const local = (type) => (e) => window.__stagePointer(type, e.clientX, e.clientY, "arrow");
  document.addEventListener("mousemove", local("move"), true);
  document.addEventListener("mousedown", local("down"), true);
  document.addEventListener("mouseup", local("up"), true);

  function pointerOn(on = true) {
    pointerHidden = !on;
    pointer.classList.toggle("on", on);
  }

  function touch(on = true) {
    touchMode = on;
    pointer.dataset.kind = on ? "touch" : "arrow";
  }

  /* ---------------------------------------------------------------- handheld morph
     The iframe really resizes to 390x844, so the app re-flows live through
     its own breakpoints while the screen shrinks into the pocket console. */
  const DEVICE = { w: 390 + 24 * 2, h: 844 + 58 + 118 };

  function morph(to) {
    if (to === "handheld") {
      const s = 728 / DEVICE.h;
      const x = Math.round(W / 2 - (DEVICE.w * s) / 2);
      const y = Math.round((H - DEVICE.h * s) / 2) - 6;
      backdrop.classList.add("on");
      screenEl.classList.add("handheld");
      screenEl.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    } else {
      screenEl.classList.remove("handheld");
      screenEl.style.transform = "";
      setTimeout(() => backdrop.classList.remove("on"), 1150);
    }
    log("morph", { to });
  }

  /* Device rect on stage once the morph lands (for placing callouts). */
  function deviceRect() {
    const s = 728 / DEVICE.h;
    const w = DEVICE.w * s;
    const h = DEVICE.h * s;
    return { x: Math.round(W / 2 - w / 2), y: Math.round((H - h) / 2) - 6, w, h };
  }

  /* ---------------------------------------------------------------- poster helper
     Park every CSS animation in the app at a chosen point of its own cycle
     (ms of active time, keyed by animation name), so the poster catches the
     title screen at a flattering moment: aura lit, glint on, ball mid-hop. */
  function freezeAll(times) {
    const parked = [];
    for (const a of doc().getAnimations()) {
      const name = a.animationName;
      if (!(name in times)) continue;
      const delay = a.effect?.getTiming?.().delay ?? 0;
      a.pause();
      a.currentTime = times[name] + delay;
      parked.push(name);
    }
    return parked;
  }

  window.stage = {
    load,
    ready,
    appRect,
    rect,
    layout,
    liveText: () => doc().querySelector('p.visually-hidden[role="status"]')?.textContent ?? "",
    camera,
    spotOn,
    spotOff,
    label,
    callout,
    unpin,
    clearPins,
    chipSet,
    chipOff,
    warmUp,
    flash,
    pointsPop,
    streakPop,
    streakBye,
    keysOn,
    keyDown,
    pointerOn,
    touch,
    morph,
    deviceRect,
    freezeAll,
    log,
    events: () => events,
  };
})();
