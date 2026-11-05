import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PageNotFound.css";
import openingPokeball from "../assets/gifs/opening-pokeball.gif";
import SystemToggles from "../components/SystemToggles";
import useSound from "../audio/useSound";
import MissingNo from "../components/battle/MissingNo";
import PixelSprite from "../components/pixel/PixelSprite";
import TypedMessage from "../components/battle/TypedMessage";
import TrainerRecords from "../components/battle/TrainerRecords";
import { RECORDS_SKELETON, readTrainerRecords } from "../components/battle/battleRecords";
import {
  CURSOR_SPRITE,
  PARTY_BALL_SPRITE,
  STATIC_BALL_SPRITE,
  TRAINER_SPRITE,
} from "../components/battle/trainerArt";

const PAGE_TITLE = "404 – Page not found | Gotta Match' Em All!";

const MESSAGES = {
  appeared: "Wild MISSINGNO. appeared!",
  error: "Error 404: this page doesn't exist.",
  run: "Got away safely!",
};

/** Intro timings (ms): text starts once both sides have slid in. */
const APPEAR_AT_MS = 800;
const ERROR_AT_MS = 2900;
/** RUN shows "Got away safely!" this long before heading home. */
const RUN_DELAY_MS = 700;

/** MISSINGNO.'s (glitched) HP, mirrored by the bar's resting width in CSS. */
const ENEMY_HP = 40;
const ENEMY_MAX_HP = 404;

/** 2x2 command grid in reading order: FIGHT BAG / POKéMON RUN. */
const COMMANDS = [
  { id: "fight", label: "FIGHT", hint: "Play" },
  { id: "bag", label: "BAG", hint: "Help" },
  { id: "pokemon", label: "POKéMON", hint: "Records" },
  { id: "run", label: "RUN", hint: "Home" },
];
const COLUMNS = 2;
const ROWS = Math.ceil(COMMANDS.length / COLUMNS);
const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const PARTY_SLOTS = [0, 1, 2, 3, 4, 5];

/** Where an arrow key moves the cursor in the grid (no wrapping, like the games). */
function gridMove(index, key) {
  const row = Math.floor(index / COLUMNS);
  const col = index % COLUMNS;
  if (key === "ArrowLeft" && col > 0) return index - 1;
  if (key === "ArrowRight" && col < COLUMNS - 1) return index + 1;
  if (key === "ArrowUp" && row > 0) return index - COLUMNS;
  if (key === "ArrowDown" && row < ROWS - 1) return index + COLUMNS;
  return index;
}

const isPlainArrow = (event) =>
  ARROW_KEYS.includes(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey;

const PageNotFound = () => {
  const navigate = useNavigate();
  const { muted, play, stop } = useSound();
  const [message, setMessage] = useState({ id: 0, kind: "blank" });
  const [cursor, setCursor] = useState(0);
  const cursorRef = useRef(0);
  const commandRefs = useRef([]);
  const runTimerRef = useRef(0);

  // Loop the wobble once the browser allows audio (first tap/key press),
  // and stop it whenever sound is muted or the page is left.
  useEffect(() => {
    if (muted) return undefined;
    let cancelled = false;

    const startOnGesture = (event) => {
      // Never start the loop from a press on the SFX / CRT switches themselves.
      if (event.target instanceof Element && event.target.closest(".sys-toggle")) return;
      removeListeners();
      if (!cancelled) play("wobble");
    };
    function removeListeners() {
      window.removeEventListener("click", startOnGesture);
      window.removeEventListener("keydown", startOnGesture);
    }

    play("wobble").then((started) => {
      if (started || cancelled) return;
      window.addEventListener("click", startOnGesture);
      window.addEventListener("keydown", startOnGesture);
    });

    return () => {
      cancelled = true;
      removeListeners();
      stop("wobble");
    };
  }, [muted, play, stop]);

  useEffect(() => {
    const previous = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  // Battle intro: "Wild MISSINGNO. appeared!" then the 404 explanation,
  // unless the player has already picked a command.
  useEffect(() => {
    const advance = (from, kind) =>
      setMessage((current) => (from.includes(current.kind) ? { id: current.id + 1, kind } : current));
    const appear = window.setTimeout(() => advance(["blank"], "appeared"), APPEAR_AT_MS);
    const explain = window.setTimeout(() => advance(["blank", "appeared"], "error"), ERROR_AT_MS);
    return () => {
      window.clearTimeout(appear);
      window.clearTimeout(explain);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(runTimerRef.current), []);

  const moveCursor = useCallback((index) => {
    cursorRef.current = index;
    setCursor(index);
  }, []);

  // Arrow keys with nothing focused wake the menu, like a real cartridge.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isPlainArrow(event)) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) return;
      const target = commandRefs.current[cursorRef.current];
      if (!target) return;
      event.preventDefault();
      target.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const showMessage = (next) => setMessage((current) => ({ ...next, id: current.id + 1 }));

  const goHome = () => {
    window.clearTimeout(runTimerRef.current);
    runTimerRef.current = 0;
    navigate("/");
  };

  const runCommand = (id) => {
    if (id === "fight") {
      navigate("/play");
    } else if (id === "bag") {
      navigate("/help");
    } else if (id === "pokemon") {
      showMessage({ kind: "records", records: readTrainerRecords() });
    } else if (id === "run") {
      // A second RUN skips the wait.
      if (runTimerRef.current) {
        goHome();
        return;
      }
      showMessage({ kind: "run" });
      runTimerRef.current = window.setTimeout(goHome, RUN_DELAY_MS);
    }
  };

  const handleMenuKeyDown = (event) => {
    if (!isPlainArrow(event)) return;
    const index = commandRefs.current.indexOf(event.target);
    if (index === -1) return;
    event.preventDefault();
    const next = gridMove(index, event.key);
    if (next !== index) commandRefs.current[next]?.focus();
  };

  let textBoxContent = null;
  if (message.kind === "records") {
    textBoxContent = <TrainerRecords key={message.id} records={message.records} />;
  } else if (MESSAGES[message.kind]) {
    textBoxContent = (
      <TypedMessage
        key={message.id}
        className="nf-message"
        text={MESSAGES[message.kind]}
        prompt={message.kind === "appeared"}
      />
    );
  }

  return (
    <div className="nf-page">
      <header className="nf-topbar">
        <SystemToggles />
      </header>

      <main className="nf-main">
        <section className="nf-console" aria-labelledby="nf-title">
          <div className="nf-bezel">
            <span className="nf-power" aria-hidden="true">
              <span className="nf-power__led" />
              Power
            </span>
            <h1 id="nf-title" className="nf-title">
              404 – Page not found
            </h1>
          </div>

          <div className="nf-screen">
            <div className="nf-scene">
              <div className="nf-hud nf-hud--enemy">
                <p className="nf-hud__name">WILD MISSINGNO.</p>
                <p className="nf-hud__level">
                  <span aria-hidden="true">Lv404</span>
                  <span className="visually-hidden">Level 404</span>
                </p>
                <div className="nf-hp">
                  <span className="nf-hp__label" aria-hidden="true">
                    HP:
                  </span>
                  <span
                    className="nf-hp__bar"
                    role="meter"
                    aria-label="MISSINGNO. HP"
                    aria-valuemin={0}
                    aria-valuemax={ENEMY_MAX_HP}
                    aria-valuenow={ENEMY_HP}
                    aria-valuetext={`${ENEMY_HP} of ${ENEMY_MAX_HP}`}
                  >
                    <span className="nf-hp__fill" />
                  </span>
                </div>
              </div>

              <div className="nf-enemy">
                <MissingNo className="nf-enemy__sprite" />
              </div>

              <div className="nf-player" aria-hidden="true">
                <PixelSprite className="pixel-sprite nf-trainer" sprite={TRAINER_SPRITE} />
                <div className="nf-throw">
                  <img
                    className="nf-throw__gif"
                    src={openingPokeball}
                    alt=""
                    width="283"
                    height="311"
                    decoding="async"
                  />
                  <PixelSprite className="pixel-sprite nf-throw__still" sprite={STATIC_BALL_SPRITE} />
                </div>
              </div>

              <div className="nf-hud nf-hud--player" aria-hidden="true">
                <div className="nf-party">
                  {PARTY_SLOTS.map((slot) => (
                    <PixelSprite key={slot} className="pixel-sprite nf-party__ball" sprite={PARTY_BALL_SPRITE} />
                  ))}
                </div>
              </div>
            </div>

            <div className="nf-panel">
              <div
                className="nes-container nf-textbox"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {/* Invisible, text-free stand-in for the tallest content (the
                    records), so the box never changes height and nothing jumps */}
                <div className="nf-textbox__sizer" aria-hidden="true">
                  <TrainerRecords records={RECORDS_SKELETON} skeleton />
                </div>
                <div className="nf-textbox__content">{textBoxContent}</div>
              </div>

              <div
                className="nes-container nf-menu"
                role="group"
                aria-label="Battle commands"
                onKeyDown={handleMenuKeyDown}
              >
                {COMMANDS.map((command, index) => (
                  <button
                    key={command.id}
                    ref={(element) => {
                      commandRefs.current[index] = element;
                    }}
                    type="button"
                    className={`nes-btn nf-command${cursor === index ? " is-cursor" : ""}`}
                    onClick={() => runCommand(command.id)}
                    onFocus={() => moveCursor(index)}
                    onMouseEnter={() => moveCursor(index)}
                    aria-label={`${command.label}, ${command.hint}`}
                  >
                    <PixelSprite className="pixel-sprite nf-command__cursor" sprite={CURSOR_SPRITE} />
                    <span className="nf-command__text">
                      <span className="nf-command__label">{command.label}</span>
                      <span className="nf-command__hint">{command.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PageNotFound;
