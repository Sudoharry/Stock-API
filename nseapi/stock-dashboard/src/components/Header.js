import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles.css';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const navigateToProfile = () => {
    navigate('/profile');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="logo">
            <i className="fas fa-chart-line"></i>
            <span>Market Pulse</span>
          </Link>
        </div>
        
        <nav className="header-nav">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/watchlist" className="nav-link">Watchlist</Link>
          <Link to="/portfolio" className="nav-link">Portfolio</Link>
          <Link to="/heatmap" className="nav-link">
            <i className="fas fa-th"></i> Heatmap
          </Link>
          {user && (
            <Link to="/chatroom" className="nav-link chat-link">
              <i className="fas fa-comments"></i> Trading Chat
              <span className="chat-badge">Live</span>
            </Link>
          )}
        </nav>

        <div className="header-right">
          {user ? (
            <div className="user-menu">
              <button 
                className="user-name"
                onClick={navigateToProfile}
              >
                <i className="fas fa-user-circle"></i>
                {user.username}
              </button>
              <button className="logout-btn" onClick={handleLogout}>
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