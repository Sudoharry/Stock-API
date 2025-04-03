import React, { useState, useEffect } from 'react';
import '../styles.css';

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/portfolio/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }

        const data = await response.json();
        setPortfolio(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  if (loading) {
    return <div className="loading">Loading portfolio...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="portfolio-container">
      <h2>My Portfolio</h2>
      {portfolio.length === 0 ? (
        <div className="empty-state">
          <p>Your portfolio is empty. Add stocks to start tracking your investments.</p>
          <button className="add-stock-btn">Add Stock</button>
        </div>
      ) : (
        <div className="portfolio-grid">
          {portfolio.map((stock) => (
            <div key={stock.id} className="portfolio-card">
              <div className="stock-header">
                <h3>{stock.symbol}</h3>
                <span className={`price-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change}%
                </span>
              </div>
              <div className="stock-details">
                <div className="detail-row">
                  <span className="label">Quantity:</span>
                  <span className="value">{stock.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Average Price:</span>
                  <span className="value">₹{stock.averagePrice}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Current Price:</span>
                  <span className="value">₹{stock.currentPrice}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Value:</span>
                  <span className="value">₹{stock.totalValue}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Profit/Loss:</span>
                  <span className={`value ${stock.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                    ₹{stock.profitLoss}
                  </span>
                </div>
              </div>
              <div className="stock-actions">
                <button className="action-btn buy">Buy More</button>
                <button className="action-btn sell">Sell</button>
                <button className="action-btn remove">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Portfolio; 