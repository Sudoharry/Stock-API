import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        top_gainers: [],
        top_losers: [],
        most_active: [],
        sector_performance: [],
        stats: {
            total_stocks: 0,
            gainers_count: 0,
            losers_count: 0,
            market_status: 'Closed'
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('Dashboard component mounted');
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            console.log('Fetching dashboard data...');
            setLoading(true);
            setError(null);
            
            const data = await getDashboardData();
            console.log('Received dashboard data:', data);
            
            if (!data) {
                throw new Error('No data received from the server');
            }

            setDashboardData(data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            
            let errorMessage = 'Failed to load dashboard data. ';
            if (err.response?.status === 404) {
                errorMessage += 'The API endpoint was not found. Please check the server configuration.';
            } else if (err.response?.status === 500) {
                errorMessage += 'Server error occurred. Please try again later.';
            } else if (!navigator.onLine) {
                errorMessage += 'Please check your internet connection.';
            } else {
                errorMessage += err.message || 'Please try again.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">Loading dashboard data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">
                    <h3>Error Loading Dashboard</h3>
                    <p>{error}</p>
                    <button onClick={fetchDashboardData} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

  return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="stats-container">
                    <div className="stat-card">
            <h3>Total Stocks</h3>
                        <div className="stat-value">{dashboardData.stats?.total_stocks || 0}</div>
          </div>
                    <div className="stat-card">
                        <h3>Market Status</h3>
                        <div className="stat-value">{dashboardData.stats?.market_status || 'Closed'}</div>
        </div>
                    <div className="stat-card">
                        <h3>Gainers/Losers</h3>
                        <div className="stat-value">
                            <span className="positive">↑{dashboardData.stats?.gainers_count || 0}</span>
                            <span className="separator">/</span>
                            <span className="negative">↓{dashboardData.stats?.losers_count || 0}</span>
          </div>
        </div>
          </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>Top Gainers</h2>
                    <div className="stock-list">
                        {dashboardData.top_gainers?.map((stock) => (
                            <div key={stock.symbol} className="stock-card">
                                <div className="stock-header">
                                    <span className="stock-symbol">{stock.symbol}</span>
                                    <span className="stock-name">{stock.name}</span>
                                </div>
                                <div className="stock-details">
                                    <span className="stock-price">₹{stock.current_price?.toFixed(2) || 'N/A'}</span>
                                    <span className="change-percent positive">
                                        +{stock.change_percentage?.toFixed(2) || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Top Losers</h2>
                    <div className="stock-list">
                        {dashboardData.top_losers?.map((stock) => (
                            <div key={stock.symbol} className="stock-card">
                                <div className="stock-header">
                                    <span className="stock-symbol">{stock.symbol}</span>
                                    <span className="stock-name">{stock.name}</span>
                                </div>
                                <div className="stock-details">
                                    <span className="stock-price">₹{stock.current_price?.toFixed(2) || 'N/A'}</span>
                                    <span className="change-percent negative">
                                        {stock.change_percentage?.toFixed(2) || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Most Active</h2>
                    <div className="stock-list">
                        {dashboardData.most_active?.map((stock) => (
                            <div key={stock.symbol} className="stock-card">
                                <div className="stock-header">
                                    <span className="stock-symbol">{stock.symbol}</span>
                                    <span className="stock-name">{stock.name}</span>
                                </div>
                                <div className="stock-details">
                                    <span className="stock-price">₹{stock.current_price?.toFixed(2) || 'N/A'}</span>
                                    <span className={`change-percent ${stock.change_percentage >= 0 ? 'positive' : 'negative'}`}>
                                        {stock.change_percentage >= 0 ? '+' : ''}{stock.change_percentage?.toFixed(2) || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Sector Performance</h2>
                    <div className="sector-list">
                        {dashboardData.sector_performance?.map((sector) => (
                            <div key={sector.name} className="sector-card">
                                <span className="sector-name">{sector.name}</span>
                                <span className={`change-percent ${sector.change_percentage >= 0 ? 'positive' : 'negative'}`}>
                                    {sector.change_percentage >= 0 ? '+' : ''}{sector.change_percentage?.toFixed(2) || 0}%
                                </span>
                            </div>
                        ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;
