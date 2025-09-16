import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/navbar-styles.css";

function NavBar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const close = () => setOpen(false);

  return (
    <header className={open ? "nav-wrapper open" : "nav-wrapper"}>
      <nav className="nav-bar">
        <div className="nav-section">
          {/* Logo */}
          <div className="nav-logo">
            <Link to="/" onClick={close}>
              <img id="logo" src="/assets/DeisyLogoTransparent.png" alt="Deisy's Tasty Food" />
            </Link>
          </div>

          {/* Desktop links */}
          <ul className="nav-list">
            <li><Link className={`nav-pages ${pathname==='/menu'?'active':''}`} to="/menu">Menu</Link></li>
            <li><Link className={`nav-pages ${pathname==='/locations'?'active':''}`} to="/locations">Locations</Link></li>
            <li><Link className={`nav-pages ${pathname==='/about'?'active':''}`} to="/about">About</Link></li>
          </ul>

          {/* Desktop buttons */}
          <div className="nav-buttons">
            <Link to="/signin" className="btn-reset sign-in">Sign in</Link>
            <Link to="/order" className="btn-reset order">Order</Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>

        {/* Mobile menu */}
        <div id="mobile-menu" className="mobile-menu">
          <Link to="/menu" className="mobile-link" onClick={close}>Menu</Link>
          <Link to="/locations" className="mobile-link" onClick={close}>Locations</Link>
          <Link to="/about" className="mobile-link" onClick={close}>About</Link>
          <Link to="/signin" className="mobile-btn sign-in" onClick={close}>Sign in</Link>
          <Link to="/order" className="mobile-btn order" onClick={close}>Order</Link>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
