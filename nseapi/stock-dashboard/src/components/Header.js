import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Header = ({ isAuthenticated, user, onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="logo">
            <i className="fas fa-chart-line"></i>
            <span>Stock Dashboard</span>
          </Link>
        </div>
        
        <nav className="header-nav">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/portfolio" className="nav-link">Portfolio</Link>
          <Link to="/watchlist" className="nav-link">Watchlist</Link>
        </nav>

        <div className="header-right">
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">{user?.username}</span>
              <button onClick={onLogout} className="logout-btn">
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                <i className="fas fa-sign-in-alt"></i>
                Login
              </Link>
              <Link to="/register" className="register-btn">
                <i className="fas fa-user-plus"></i>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 