import React from "react";
import '../styles/LandingPage.css';
import { useNavigate } from 'react-router-dom'
const LandingPage = () => {
  const navigate = useNavigate()
  return (
    <section className="container">
<div className="centering">
  <h1>Gotta Match'Em All!</h1>

<div className="landing-buttons">
  <button 
    type="button" 
    className="nes-btn is-warning" 
    onClick={() => navigate("/play")}
  >
    <span className="press-start">Start Game</span>
  </button>

  <button 
    className="nes-btn is-primary help-btn" 
    onClick={() => navigate("/help")}
  >
    Help
  </button>
</div>



  <p className="api-credit">
    Source API{" "}
    <a className="link" href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">
      here
    </a>
  </p>
</div>


      <div className="footer">
        <span>&copy; {new Date().getFullYear()} aaronstark1</span>
        <i className="nes-pokeball pokeball-loader"></i>
        <span>Want to check the repo?</span>
        <a className="link" href="https://github.com/AaronStark1" target="_blank" rel="noopener noreferrer">
          <i className="nes-icon github is-medium"></i>
        </a>
      </div>
    </section>
  );
};

export default LandingPage;
