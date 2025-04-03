import React, { useState, useEffect } from 'react';
import AddToWatchlist from './AddToWatchlist';
import '../styles.css';

const Watchlist = () => {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/watchlist/');
      const data = await response.json();
      
      if (response.ok) {
        setWatchlistItems(data);
      } else {
        setError('Failed to fetch watchlist');
      }
    } catch (err) {
      setError('An error occurred while fetching the watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = (newStock) => {
    setWatchlistItems(prev => [...prev, newStock]);
  };

  const handleRemoveStock = async (stockId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/watchlist/${stockId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWatchlistItems(prev => prev.filter(item => item.id !== stockId));
      } else {
        setError('Failed to remove stock from watchlist');
      }
    } catch (err) {
      setError('An error occurred while removing the stock');
    }
  };

  const filteredItems = watchlistItems.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        Loading watchlist...
      </div>
    );
  }

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
        <h2>My Watchlist</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="add-stock-btn" onClick={() => setShowAddForm(true)}>
            <i className="fas fa-plus"></i> Add Stock
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {watchlistItems.length === 0 ? (
        <div className="empty-state">
          <p>Your watchlist is empty. Add some stocks to track!</p>
          <button className="add-stock-btn" onClick={() => setShowAddForm(true)}>
            <i className="fas fa-plus"></i> Add Your First Stock
          </button>
        </div>
      ) : (
        <div className="watchlist-table">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company Name</th>
                <th>Current Price</th>
                <th>Target Price</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>{item.symbol}</td>
                  <td>{item.companyName}</td>
                  <td className={item.priceChange >= 0 ? 'positive' : 'negative'}>
                    ${item.currentPrice}
                    <span className="price-change">
                      {item.priceChange >= 0 ? '+' : ''}{item.priceChange}%
                    </span>
                  </td>
                  <td>${item.targetPrice || '—'}</td>
                  <td>{item.notes || '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn buy">
                        <i className="fas fa-shopping-cart"></i> Buy
                      </button>
                      <button
                        className="action-btn remove"
                        onClick={() => handleRemoveStock(item.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <AddToWatchlist
            onAdd={handleAddStock}
            onClose={() => setShowAddForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Watchlist; 