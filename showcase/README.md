# Gotta Match 'Em All showcase reel

A 45-second product reel of the real game, recorded with Playwright and cut with ffmpeg. It plays as a hover preview on the portfolio card and in the portfolio's showcase modal. The same pipeline takes the images in the [app's README](../README.md).

| File | What it is |
| --- | --- |
| `out/pokemon-match-showcase.mp4` | 1920×1080, 30 fps, exactly 45.0 s (1,350 frames). H.264 High@4.1, yuv420p, BT.709, faststart. AAC 128 kb/s stereo at about −18 LUFS. About 9 MB. |
| `out/pokemon-match-poster.webp` | 1920×1080 poster (WebP, quality 90). It shows the title screen at rest, and it is the reel's first and last frame. |
| `out/pokemon-match-poster.png` | The same frame, lossless. The portfolio uses it as the card thumbnail (`project5.png`), so the card, the poster and the reel's opening frame all match. |
| `record-showcase.mjs` | The pipeline: build the app, warm-up, poster pass, the take, then cut, soundtrack, encode and poster. |
| `readme-media.mjs` | The README media: screenshots and an animated gameplay preview, written to `../docs/media/`. See [README media](#readme-media). |
| `stage/` | The "director stage": the app in an iframe, plus the reel's own layer around it (camera, callouts, pointer, CRT warm-up, handheld shell). |
| `audio.mjs` | Soundtrack builder: the app's sounds plus synthesised sound design, mixed from the take's event log. |

`out/` is git-ignored: `npm run record` regenerates it, and the portfolio keeps the published copies.

## What the reel shows

| Act | Time | What happens |
| --- | --- | --- |
| 1 · Title screen | 0–6 s | It opens on the title screen itself with a gentle CRT warm-up: a phosphor bloom and one soft refresh band. The pointer presses PRESS START. On the menu (logo, difficulty, Hall of Fame records) it hovers Easy then Medium and presses START GAME, which triggers a golden flash. |
| 2 · Arcade HUD | 6–14 s | The game's own "Catching Pokémon…" loader wobbles and fades into the board. One smooth camera move: ease in to 1.15×, then a slow sideways glide while a spotlight walks Score, Time and Best. SFX and CRT are toggled off and on (the scanlines really disappear), then the camera eases out. |
| 3 · Gameplay | 14–26 s | Pikachu + Charmander is a mismatch: red border, retro shake, 8-bit buzz. Then three straight matches (Pikachu, Gengar, Squirtle), each with the golden pulse, sparkles, the match chime and a board-size `+100`, plus the `STREAK ×2!` / `×3!` badges. |
| 4 · Under the hood | 26–33 s | Two NES-style callouts. A triple click flips the card once (the reducer's double-click guard, with its code). Then arrow keys move the dashed gold focus ring and Enter makes the match, with keycaps lighting up. |
| 5 · Handheld | 33–39 s | The screen shrinks into a pocket console while the iframe really resizes to 390×844, so the app re-flows live through its own breakpoints. A `📱 RESPONSIVE: Live Breakpoint Reflow` badge, plus `100dvh` and touch callouts. Two taps match Jigglypuff on the phone layout. |
| 6 · Hall of Fame | 39–45 s | The final pair (Charmander, the mismatched card from Act 3) wins the game: Pikachu cheering, Pokéball confetti, 3★ Master Trainer, New Best score and time, and the Caught Pokémon tray. The pointer presses HOME and the app returns to the title screen. The reel settles on the exact frame it started on. |

### The loop

The reel's first and last frames are the same lossless still: the title screen, with each looping animation parked at a flattering point (PRESS START aura lit, logo glints on, footer Poké Ball mid-hop).

The reel eases off that still into the live take in 0.5 s, under the warm-up. After HOME, the live title screen eases back onto it in 0.5 s. Both blends are title screen onto title screen, so only the animated wallpaper and the button aura change. The encoded first and last frames measure about 41 dB PSNR apart, which is visually identical.

### What is the app, and what is the reel

Every frame of the game is the production build running in Chromium: its animations, loader, sounds, timer, records, Pokédex, and the HOME navigation. Nothing is mocked inside the app.

The stage draws its own layer around the app:
- the camera move and the spotlight
- labels, callouts and keycaps
- the act chip
- the CRT warm-up
- the handheld shell

It also draws the pointer. Headless Chromium paints no cursor, so the stage shows the app's own `pokecursor.png` / `pokepointer.png`, picked from the cursor the app's CSS asks for under the mouse.

Two overlays are reel commentary, not game features:
- **`+100` popups.** These board-size popups echo the HUD's own real `+100`.
- **The streak badge.** The game has no streak or multiplier mechanic: the badge counts consecutive matches ("2 MATCHES IN A ROW"), and every match still scores the game's real +100.

## Demo data

- **Same board every run.** `Math.random` is seeded (seed 15) in the app frame. It is re-seeded when `/play` is pushed, because React Router spends one value on the history key just before. The species list is pinned to six Pokémon (Pikachu, Charmander, Gengar, Squirtle, Bulbasaur, Jigglypuff). The result is always the same deal on the same background. The script checks the deal against `EXPECTED_LAYOUT` and stops if it ever changes.
- **Real sprites, cached.** The sprites are the real PokéAPI sprites, downloaded once into `.cache/sprites/` (git-ignored) and served from there. The sprite host can take 10 s to connect, which is longer than the app's 8 s image timeout.
- **Loader on screen.** The species request is held for 950 ms in the take, so the real preloader gets a beat on screen before it fades into the board.
- **A lived-in save.** `localStorage` is seeded with prior records (Easy 480 pts / 00:52, Medium 640 / 01:37), a 37-species Pokédex, and Easy as the preferred difficulty. The menu therefore opens on Easy's records, and the win shows two New Best badges, "+6 NEW" and "POKéDEX 43/898".

## Sound

- **The app's own sounds:**
  - `card_match.mp3` and the victory theme, at the app's 0.6 volume. They behave like the app's single `<audio>` element per sound: a new match restarts the chime, and leaving the board pauses both, so the victory theme stops at HOME.
  - The mismatch buzz, re-synthesised with `SoundProvider.buzz()`'s exact square-wave sweep. It is raised in level so it reads in the mix.
- **The reel's own sound design**, synthesised in `audio.mjs` (band-limited pulse, triangle and noise):
  - the CRT warm-up hum
  - UI blips and the START "coin-up"
  - key ticks, taps and whooshes
  - the streak arpeggios
  - an original I–vi–IV–V chiptune bed at 150 BPM
- **Mix and loudness.** The bed sits about 9 dB under the game's sounds, ducks a further ~11 dB whenever the game plays one, and fades out before the victory fanfare. The mix gets one linear gain toward −16 LUFS, with at most 2.5 dB of fast limiting on chime transients and a true-peak check (≤ −1.5 dBTP).
- **Safety checks.** The script fails rather than ship a broken take: it asserts that SFX and CRT end ON, and that the take logged six match chimes and the victory theme.

## Regenerate

You need Node 20+ and network access: npm, Google Fonts, and the first sprite download.

```bash
cd showcase
npm install                      # playwright 1.64.1 + ffmpeg-static 5.3.0 (libx264, libwebp)
npx playwright install chromium  # only if Playwright's Chromium isn't cached yet
npm run record                   # about 2 min; rewrites out/*.mp4, out/*.webp, out/*.png
npm run media                    # about 75 s; rewrites ../docs/media/ (the app README's images)
```

- `node record-showcase.mjs --keep` keeps `.work/`: raw screencast frames, the cut sequence, the poster PNG, the soundtrack WAVs, and `take.json` with marks, the event log and frame timestamps. It is about 650 MB and git-ignored.
- `node record-showcase.mjs --reencode` re-cuts the take kept by `--keep` and re-encodes it, without re-recording. It is handy for encoder or soundtrack tweaks.

The app's own `npm install` must have run, because the pipeline builds the app with its Vite.

Then copy `out/pokemon-match-showcase.mp4` and `out/pokemon-match-poster.webp` to `aaron-portfolio/public/projects/showcase/`, and `out/pokemon-match-poster.png` to `aaron-portfolio/public/projects/project5.png`.

### How it works

- **Build and serve.** `vite build` goes into `.work/app`, and a tiny static server on `127.0.0.1` serves it with an SPA fallback. The same origin also serves `stage/`, so the stage can reach into the app's iframe.
- **Browser.** Playwright's Chromium in new headless mode, in a 1440×810 CSS-pixel window at `--force-device-scale-factor` 4/3, which is exactly 1920×1080 device pixels.
  - At this size the Easy board fills the frame top to bottom, with margins for callouts.
  - On macOS it composites on the GPU (ANGLE/Metal). That gives about 47 fps of 1080p screencast, roughly double the software-rendered headless shell.
  - The window is grown with CDP until the page itself is exactly 1440×810.
- **Passes:**
  1. Warm-up: fonts, GIFs and sprites go into the cache, and the deal is checked.
  2. Poster pass: the title screen, with every looping CSS animation parked by name (`POSTER_POSE`). Lossless screenshot.
  3. The take: one continuous performance. Each beat is scheduled at an absolute time from T0 (`await T(seconds)`), so a late beat never shifts the ones after it.
- **Capture.** CDP `Page.startScreencast` delivers JPEG frames with swap timestamps. Output frame *k* shows the latest captured frame at or before T0 + k/30.
- **Input.**
  - Pointer moves follow a gently bowed Bézier path with minimum-jerk easing.
  - Presses on the console toggles re-centre first, because the camera is gliding.
  - Keys go through Playwright's keyboard to the focused card, so the app's own arrow-key handler moves focus.
  - The app frame forwards its mouse events to the stage, mapped through the camera and morph transforms, to drive the overlay pointer.
- **Edit.** The poster still for 0.1 s, a 0.5 s dissolve into the take, then the take. From 44.3 s a 0.5 s dissolve lands back on the still, which holds to the last frame.
- **Encode.** Two-pass libx264 `veryslow`, `-tune animation`, at 1.6 Mb/s (VBV 2.8 Mb/s peak, 3.6 Mb buffer), GOP 300, BT.709 tags, `+faststart`.
  - The app's animated anime-GIF backdrops sit under the CRT scanlines, and this rate keeps them clean through the camera move.
  - Both poster ends get 6× bitrate (x264 zones), and the closing still starts on a forced keyframe, so the last frame is coded like the first.

To retime a beat, edit its `await T(…)` in `record()`. Acts are commented `ACT 1` … `ACT 6`. To change the overlays, edit `stage/`. Each overlay is a cue on `window.stage` (`camera`, `spotOn`, `label`, `callout`, `pointsPop`, `streakPop`, `morph`, `warmUp`, …).

## README media

`npm run media` takes the images in the app's README from the same build, seeded deal and lived-in save as the reel, so the README shows the same board, records and Pokédex.

- **Desktop:** 1440×810 CSS px at 4/3. It captures the title screen (posed like the poster, kept at 1920×1080), the menu, the board mid-game, the victory screen, the help page and the 404 battle. Everything except the title is scaled to 1440×810, which keeps the CRT scanlines on whole pixels.
- **Phone:** 390×844 CSS px at 2×, with touch input. It captures the title screen, the board and the victory screen.
- **Gameplay preview:** 5.6 s of the reel (a mismatch, then the Pikachu match) as a 960×540, 15 fps animated WebP. It ends before the reel's streak badge, which is reel commentary rather than a game feature. It is cut from `out/pokemon-match-showcase.mp4`, so run `npm run record` first; without the reel, the existing preview is kept.

It plays a perfect six-move game for the board and victory shots. Like the reel, it stops if the seeded deal ever changes.

## Embedding as a hover preview

```html
<video src="pokemon-match-showcase.mp4" poster="pokemon-match-poster.webp"
       muted loop playsinline preload="metadata"
       width="1920" height="1080" style="width:100%;height:auto"></video>
```
