import { useId, useState } from "react";
import pokeBall from "../../assets/poke-ball.png";
import { POKEDEX_SIZE } from "../../utils/pokedex";
import { formatDexNumber } from "../../utils/format";
import { spriteStyle } from "./winHelpers";

/** One Pokédex slot: warm cardstock tile with sprite, Dex number, name and NEW tag. */
const TraySlot = ({ pokemon, index }) => {
  const [broken, setBroken] = useState(false);
  const isFallback = broken || pokemon.imageFailed || !pokemon.image;
  const name = pokemon.name || "???";
  let nameSize = "";
  if (name.length > 11) nameSize = " is-xlong";
  else if (name.length > 9) nameSize = " is-long";

  return (
    <li className={`win-slot${pokemon.isNew ? " is-new" : ""}`} style={{ "--slot-index": index }}>
      <span className="visually-hidden">
        {`${name}, number ${pokemon.id}${pokemon.isNew ? ", new to your Pokédex" : ""}`}
      </span>
      <span className="win-slot-card" aria-hidden="true">
        <span className="win-slot-head">
          <span className="win-slot-dex">{formatDexNumber(pokemon.id)}</span>
          {pokemon.isNew && <span className="win-slot-new">NEW</span>}
        </span>
        <span className="win-slot-art">
          {isFallback ? (
            <img className="win-slot-sprite is-fallback" src={pokeBall} alt="" draggable="false" />
          ) : (
            <img
              className={`win-slot-sprite${pokemon.spriteFit ? " is-fitted" : ""}`}
              src={pokemon.image}
              alt=""
              width="96"
              height="96"
              draggable="false"
              // Same request mode as the board's preload, so the decoded sprite is reused
              crossOrigin={pokemon.cors ? "anonymous" : undefined}
              style={spriteStyle(pokemon.spriteFit, false)}
              onError={() => setBroken(true)}
            />
          )}
        </span>
        <span className={`win-slot-name${nameSize}`}>{name}</span>
      </span>
    </li>
  );
};

/**
 * "Pokédex shelf" of every Pokémon caught this round, in catch order,
 * plus the running Pokédex total.
 */
const CaughtTray = ({ caught, newlyCaught, pokedexCount }) => {
  const titleId = useId();
  const entries = Array.isArray(caught) ? caught : [];
  const total = Number.isFinite(pokedexCount) ? pokedexCount : 0;
  const fresh = Number.isFinite(newlyCaught) ? newlyCaught : 0;

  return (
    <div className="nes-container is-dark with-title win-tray">
      <h2 id={titleId} className="title win-tray-title">
        <span aria-hidden="true">CAUGHT POKéMON</span>
        <span className="visually-hidden">Caught Pokémon</span>
      </h2>

      {entries.length > 0 ? (
        // --tray-cols is inherited from .win-box, which also sizes the box with it
        <ul role="list" className="win-tray-list" aria-labelledby={titleId}>
          {entries.map((pokemon, index) => (
            <TraySlot key={`${pokemon.id}-${index}`} pokemon={pokemon} index={index} />
          ))}
        </ul>
      ) : (
        <p className="win-tray-empty">No Pokémon caught this round.</p>
      )}

      <div className="win-dex">
        <p className="win-dex-summary">
          <span aria-hidden="true">
            <span className="win-dex-new">+{fresh} NEW</span>
            <span className="win-dex-sep"> · </span>
            <span className="win-dex-count">
              POKéDEX {total}/{POKEDEX_SIZE}
            </span>
          </span>
          <span className="visually-hidden">
            {`${fresh} new this round. Pokédex: ${total} of ${POKEDEX_SIZE} caught.`}
          </span>
        </p>
        <progress
          className="nes-progress is-success win-dex-bar"
          value={Math.min(total, POKEDEX_SIZE)}
          max={POKEDEX_SIZE}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default CaughtTray;
