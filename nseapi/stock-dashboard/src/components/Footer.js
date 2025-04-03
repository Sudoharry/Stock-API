import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Stock Dashboard</h4>
          <p>Your trusted source for real-time stock market data and portfolio management.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/portfolio">Portfolio</Link></li>
            <li><Link to="/watchlist">Watchlist</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Connect With Us</h4>
          <div className="social-links">
            <a href="#" className="social-link"><i className="fab fa-twitter"></i></a>
            <a href="#" className="social-link"><i className="fab fa-linkedin"></i></a>
            <a href="#" className="social-link"><i className="fab fa-github"></i></a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Stock Dashboard. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 