import React from 'react';
import '../styles.css';

const TopStocks = ({ stocks = [] }) => {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="stocks-container">
        <div className="card-header">
          <h3>Top Performing Stocks</h3>
        </div>
        <div className="stocks-content">
          <p>No stocks data available</p>
        </div>
      </div>
    );
  }

  // Format currency value
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0.00';
    return `₹${Number(value).toFixed(2)}`;
  };

  // Format percentage value
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.00';
    return Number(value).toFixed(2);
  };

  return (
    <div className="stocks-container">
      <div className="card-header">
        <h3>Top Performing Stocks</h3>
      </div>
      <div className="top-stocks-list">
        {stocks.map((stock, index) => (
          <div key={index} className="stock-item">
            <div className="stock-rank">#{index + 1}</div>
            <div className="stock-main-info">
              <div className="stock-symbol">{stock.symbol}</div>
              <div className="stock-name">{stock.name}</div>
            </div>
            <div className="stock-price">{formatCurrency(stock.current_price)}</div>
            <div className={`stock-change ${stock.change_percentage >= 0 ? 'positive' : 'negative'}`}>
              {stock.change_percentage >= 0 ? '+' : ''}{formatPercentage(stock.change_percentage)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopStocks; 