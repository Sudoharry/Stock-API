import React from "react";
import SectorsPieChart from "./SectorsPieChart";

const Dashboard = ({ data, sectors }) => {
  const { totalStocks, marketStatus, gainersCount, losersCount } = data || {};
  
  return (
    <section className="dashboard-section">
      <div className="dashboard-grid">
        {/* Total Stocks Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <i className="fas fa-chart-line card-icon"></i>
            <h3>Total Stocks</h3>
          </div>
          <p className="dashboard-number">{totalStocks || 0}</p>
        </div>

        {/* Gainers/Losers Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <i className="fas fa-chart-bar card-icon"></i>
            <h3>Market Performance</h3>
          </div>
          <div className="performance-container">
            <div className="performance positive">
              <i className="fas fa-arrow-up"></i>
              <span>{gainersCount || 0}</span>
              <span className="label">Gainers</span>
            </div>
            <div className="performance negative">
              <i className="fas fa-arrow-down"></i>
              <span>{losersCount || 0}</span>
              <span className="label">Losers</span>
            </div>
          </div>
        </div>

        {/* Market Status Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <i className="fas fa-building card-icon"></i>
            <h3>Market Status</h3>
          </div>
          <div className="market-status-display">
            <p className={`status-pill ${marketStatus === "Open" ? "positive" : "negative"}`}>
              {marketStatus || "Closed"}
            </p>
            <p className="market-time">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Sectors Performance Chart */}
      <div className="sectors-performance">
        {sectors && sectors.length > 0 && (
          <SectorsPieChart sectors={sectors} />
        )}
      </div>
    </section>
  );
};

export default Dashboard;
