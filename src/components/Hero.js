import React from 'react';
import SearchBar from './SearchBar';

function Hero() {
  return (
    <main className="hero-content">
      <div className="badge">
        <p>Search any developer profile</p>
      </div>
      <h1 className="hero-title">
        Your Lens Into Any Developer's <br/>GITHUB UNIVERSE
      </h1>
      <p className="hero-subtitle">
        Uncover insights, analyze repositories and explore coding patterns in one unified platform.
      </p>
      
      <SearchBar />
    </main>
  );
}

export default Hero;
