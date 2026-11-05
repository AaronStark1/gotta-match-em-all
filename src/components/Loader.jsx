import "../styles/Loader.css";

const Loader = ({ fading = false }) => {
  return (
    <div
      className={`loader-overlay ${fading ? "fade-out" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={fading || undefined}
    >
      <div className="loader-content">
        <div className="loader-ball" aria-hidden="true">
          <i className="nes-pokeball" />
        </div>
        <p className="loading-text">Catching Pokémon...</p>
      </div>
    </div>
  );
};

export default Loader;
