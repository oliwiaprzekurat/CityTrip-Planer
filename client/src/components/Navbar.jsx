import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import "./Navbar.css";


export const Navbar = () => {
  return (
    <nav className='navbar'>
      <div className='logo'>
        <img src="/logo1.png" alt="CityTrip Logo" className='logo-image' />
      </div>
      <div className='title'>
        CityTrip
      </div>
      <div className="right-items">
      </div>
    </nav>
  );
};