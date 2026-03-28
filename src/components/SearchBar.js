import React from 'react';

function SearchBar() {
  return (
    <div className="search-container">
      
      <input type="text" className="search-input" placeholder="Enter a username to begin..." />
      <button className="search-button">
        Search
      </button>
    </div>
  );
}

export default SearchBar;
