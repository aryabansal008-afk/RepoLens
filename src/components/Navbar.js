import React from 'react';
import { Link } from 'react-router-dom';
import logo from './logo.png';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <div className='logo'>
        <img src={logo} alt="logo" /></div>
        <div className='name'>
      RepoLens </div>
      </div>
      <div className="nav-links">
        <Link to="/">Data Explore</Link>
        <Link to="/languages">Languages</Link>
        <a href="#blog">Blog</a>
        <a href="#faqs">FAQs</a>
      </div>
      <button className="nav-event">Total Events</button>
    </nav>
  );
}

export default Navbar;
