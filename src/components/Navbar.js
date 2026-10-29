import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from './logo.png';

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <nav className="navbar" aria-label="Primary">
      <NavLink to="/" className="nav-logo" aria-label="RepoLens home" end>
        <div className="logo">
          <img src={logo} alt="" />
        </div>
        <div className="name">RepoLens</div>
      </NavLink>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="primary-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        Menu
      </button>
      <div className={`nav-links ${open ? 'open' : ''}`} id="primary-navigation">
        <NavLink to="/data-explore">Data Explore</NavLink>
        <NavLink to="/languages">Languages</NavLink>
        <NavLink to="/blog">Blog</NavLink>
        <NavLink to="/faqs">FAQs</NavLink>
        <NavLink to="/events" className="nav-event nav-event-menu">Total Events</NavLink>
      </div>
      <NavLink to="/events" className="nav-event nav-event-bar">Total Events</NavLink>
    </nav>
  );
}

export default Navbar;
