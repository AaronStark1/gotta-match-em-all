import React, { useState, useEffect } from "react";
import "../styles/Game.css";
import bg1 from "../assets/backgrounds/bg1.gif";
import bg2 from "../assets/backgrounds/bg2.gif";
import bg3 from "../assets/backgrounds/bg3.gif";
import bg4 from "../assets/backgrounds/bg4.gif";
import bg5 from "../assets/backgrounds/bg5.gif";
import bg6 from "../assets/backgrounds/bg6.gif";
import Card from "../components/Card";
import ScoreBoard from "../components/ScoreBoard";
import { OFFICIAL_ARTWORK } from "../config/api";
import Loader from "../components/Loader";
import WinScreen from "../components/WinScreen";
import matchSfx from "../assets/sounds/card_match.mp3";
import victorySfx from "../assets/sounds/pokemon-victory-theme.mp3";


const TOTAL_CARDS = 16; // 4x4 grid
const backgrounds = [bg1, bg2, bg3, bg4, bg5, bg6];
const matchSound = new Audio(matchSfx);
matchSound.volume = 0.6; // adjust bass here
const Game = () => {
  const [cards, setCards] = useState([]);
  const [background, setBackground] = useState(null);
  const [flippedCards, setFlippedCards] = useState([]);
  const [score, setScore] = useState(0);
  const [turns, setTurns] = useState(0);
  const [disableClicks, setDisableClicks] = useState(false);
  const allMatched = cards.length > 0 && cards.every(card => card.matched);
  const [winSoundPlayed, setWinSoundPlayed] = useState(false);

  // Card match audio 



  const shuffleArray = (array) =>
    [...array]
      .map((item) => ({ sort: Math.random(), value: item }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.value);

  useEffect(() => {
    if (allMatched && !winSoundPlayed) {
      const audio = new Audio(victorySfx);
      audio.volume = 0.6;
      audio.play();
      setWinSoundPlayed(true);
    }
  }, [allMatched, winSoundPlayed]);

  useEffect(() => {
    const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground(randomBg);
  }, []);

  useEffect(() => {
    const fetchPokemons = async () => {
      try {
        const numPairs = TOTAL_CARDS / 2;
        const randomIds = new Set();

        while (randomIds.size < numPairs) {
          randomIds.add(Math.floor(Math.random() * 1000) + 1);
        }

        const speciesResponses = await Promise.all(
          Array.from(randomIds).map((id) =>
            fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((res) => res.json())
          )
        );

        const pokemonData = speciesResponses.map((species) => ({
          id: species.id,
          name: species.name,
          image: `${OFFICIAL_ARTWORK}/${species.id}.png`,
        }));

        const duplicated = [...pokemonData, ...pokemonData];
        const shuffled = shuffleArray(duplicated);

        const finalCards = shuffled.map((card, index) => ({
          ...card,
          uniqueId: index,
          flipped: false,
          matched: false,
        }));

        setCards(finalCards);
      } catch (err) {
        console.error("Error fetching Pokémon:", err);
      }
    };

    fetchPokemons();
  }, []);

  const handleCardClick = (uniqueId) => {
    if (disableClicks) return;

    setCards((prev) =>
      prev.map((card) =>
        card.uniqueId === uniqueId ? { ...card, flipped: true } : card
      )
    );

    const clickedCard = cards.find((c) => c.uniqueId === uniqueId);
    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setDisableClicks(true);
      setTurns((t) => t + 1);

      const [card1, card2] = newFlipped;

      if (card1.id === card2.id) {
        // ✅ Play match sound
        matchSound.currentTime = 0;
        matchSound.play();

        setCards((prev) =>
          prev.map((card) =>
            card.id === card1.id ? { ...card, matched: true } : card
          )
        );

        setScore((s) => s + 100);
        setFlippedCards([]);
        setDisableClicks(false);

      } else {
        // ❌ Mismatch
        setScore((s) => s - 20);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.uniqueId === card1.uniqueId || card.uniqueId === card2.uniqueId
                ? { ...card, flipped: false }
                : card
            )
          );

          setFlippedCards([]);
          setDisableClicks(false);
        }, 1000);
      }
    }


  };
  // Loader 
  if (cards.length === 0 || !background) {
    return <Loader />;
  }

  // WinScreen 
  if (allMatched) {
    return <WinScreen score={score} turns={turns} />;
  }

  return (

    <section
      className="game-container"
      style={{ backgroundImage: `url(${background})` }}
    >
      <h1 className="game-title">Gotta Match' Em All!</h1>

      <div className="game-controls">
        <button className="nes-btn is-primary" onClick={() => window.location.href = "/"}>
          Home
        </button>

        <button
          className="nes-btn is-error"
          onClick={() => window.location.reload()}
        >
          Reset
        </button>
      </div>

      <div className="grid-wrapper">
        <ScoreBoard score={score} turns={turns} />

        <div className="grid">
          {cards.map((card) => (
            <Card
              key={card.uniqueId}
              card={card}
              onClick={() =>
                !card.flipped && !card.matched && handleCardClick(card.uniqueId)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );

};

export default Game;
