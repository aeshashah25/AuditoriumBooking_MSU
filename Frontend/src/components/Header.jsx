import React from 'react';
//import '../styles/Header.css';  // Import component-specific styles

const Header = () => {
  return (
    <header className="header">
      <div id="menu-btn" className="fas fa-bars"></div>
      <a href="#" className="logo">coffee <i className="fas fa-mug-hot"></i></a>
      <nav className="navbar">
        <a href="#home">home</a>
        <a href="#about">about</a>
        <a href="#menu">menu</a>
        <a href="#review">review</a>
        <a href="#book">book</a>
      </nav>
      <a href="#" className="btn">book a table</a>
    </header>
  );
}

export default Header;
