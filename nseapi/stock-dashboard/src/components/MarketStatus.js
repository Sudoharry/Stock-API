import React from 'react';
import '../styles.css';

const MarketStatus = ({ status }) => {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <i className="fas fa-clock card-icon"></i>
        <h3>Market Status</h3>
      </div>
      <div className="status-pill">
        {status === 'Open' ? (
          <span className="positive">Open</span>
        ) : (
          <span className="negative">Closed</span>
        )}
      </div>
    </div>
  );
};

export default MarketStatus; 