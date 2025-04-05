import React from 'react';
import '../styles.css';

const TopStocks = ({ stocks }) => {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <i className="fas fa-chart-line card-icon"></i>
        <h3>Top Stocks</h3>
      </div>
      <div className="stock-list">
        {stocks.map((stock, index) => (
          <div key={index} className="stock-item">
            <div className="stock-info">
              <span className="stock-symbol">{stock.symbol}</span>
              <span className={`stock-change ${stock.change_percentage >= 0 ? 'positive' : 'negative'}`}>
                {stock.change_percentage >= 0 ? '+' : ''}{stock.change_percentage}%
              </span>
            </div>
            <div className="stock-price">₹{stock.current_price}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopStocks; 