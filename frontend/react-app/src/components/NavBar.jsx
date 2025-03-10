import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/navbar-styles.css'; 

function NavBar() {
  return (
    <header>
      <nav className="nav-bar">
        <div className="nav-section">
          <div className="nav-logo">
            <Link to="/">
              <img id="logo" src="/assets/DeisyLogoTransparent.png" alt="logo" />
            </Link>
          </div>
          <ul className="nav-list">
            <li>
              <Link className="nav-pages" to="/menu">Menu</Link>
            </li>
            <li>
              <Link className="nav-pages" to="/locations">Locations</Link>
            </li>
            <li>
              <Link className="nav-pages" to="/about">About</Link>
            </li>
          </ul>
          <div className="nav-buttons">
            <button className="sign-in">Sign in</button>
            <button className="order">Order</button>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;