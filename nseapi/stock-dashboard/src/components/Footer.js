import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>About Market Pulse</h4>
          <p>
            Your comprehensive platform for real-time stock market analysis, portfolio management,
            and investment tracking. Make informed decisions with our advanced analytics and
            market insights.
          </p>
          <div className="social-links">
            <a href="https://twitter.com" className="social-link" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://linkedin.com" className="social-link" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-linkedin-in"></i>
            </a>
            <a href="https://facebook.com" className="social-link" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://instagram.com" className="social-link" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/dashboard">
                <i className="fas fa-chart-line"></i>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/portfolio">
                <i className="fas fa-briefcase"></i>
                Portfolio
              </Link>
            </li>
            <li>
              <Link to="/watchlist">
                <i className="fas fa-star"></i>
                Watchlist
              </Link>
            </li>
            <li>
              <Link to="/market-news">
                <i className="fas fa-newspaper"></i>
                Market News
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Investment Tools</h4>
          <ul>
            <li>
              <Link to="/stock-screener">
                <i className="fas fa-search-dollar"></i>
                Stock Screener
              </Link>
            </li>
            <li>
              <Link to="/technical-analysis">
                <i className="fas fa-chart-bar"></i>
                Technical Analysis
              </Link>
            </li>
            <li>
              <Link to="/fundamental-analysis">
                <i className="fas fa-balance-scale"></i>
                Fundamental Analysis
              </Link>
            </li>
            <li>
              <Link to="/risk-calculator">
                <i className="fas fa-calculator"></i>
                Risk Calculator
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Learning Center</h4>
          <ul>
            <li>
              <Link to="/education">
                <i className="fas fa-graduation-cap"></i>
                Investment Education
              </Link>
            </li>
            <li>
              <Link to="/strategies">
                <i className="fas fa-lightbulb"></i>
                Trading Strategies
              </Link>
            </li>
            <li>
              <Link to="/glossary">
                <i className="fas fa-book"></i>
                Financial Glossary
              </Link>
            </li>
            <li>
              <Link to="/faq">
                <i className="fas fa-question-circle"></i>
                FAQ
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-info">
          <div className="footer-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span className="separator">•</span>
            <Link to="/terms">Terms of Service</Link>
            <span className="separator">•</span>
            <Link to="/disclaimer">Investment Disclaimer</Link>
          </div>
          <p className="copyright">
            © {new Date().getFullYear()} Market Pulse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 