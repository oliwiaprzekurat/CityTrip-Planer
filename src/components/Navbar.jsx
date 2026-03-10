import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import "./Navbar.css";


export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);


  return (
    <nav className='navbar'>
      <div className='title'>
        Weather&Planner
      </div>
      <div className="right-items">
    
          <>
            <Link to="/log" className="log">Zaloguj się</Link>
            <Link to="/register" className="log">Załóż konto</Link>
          </>
       
      </div>
    </nav>
  );
};