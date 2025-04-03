import React from "react";

const Dashboard = ({ data }) => {
  const { totalStocks, marketStatus, gainersCount, losersCount } = data || {};
  
  return (
    <section className="dashboard-section">
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <i className="fas fa-chart-line card-icon"></i>
            <h3>Total Stocks</h3>
          </div>
          <p className="dashboard-number">{totalStocks || 0}</p>
        </div>
        <div className="dashboard-card">
          <div className="card-header">
            <i className="fas fa-building card-icon"></i>
            <h3>Market Status</h3>
          </div>
          <p className={`dashboard-text status-pill ${marketStatus === "Open" ? "positive" : "negative"}`}>
            {marketStatus || "Closed"}
          </p>
        </div>
        <div className="dashboard-card">
          <div className="card-header">
            <i className="fas fa-chart-bar card-icon"></i>
            <h3>Gainers/Losers</h3>
          </div>
          <div className="performance-container">
            <div className="performance positive">
              <i className="fas fa-arrow-up"></i>
              <span>{gainersCount || 0}</span>
            </div>
            <div className="performance negative">
              <i className="fas fa-arrow-down"></i>
              <span>{losersCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
