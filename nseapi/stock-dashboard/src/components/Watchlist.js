import React, { useState, useEffect } from 'react';
import '../styles.css';

function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/watchlist/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch watchlist data');
        }

        const data = await response.json();
        setWatchlist(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredWatchlist = watchlist.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading watchlist...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
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
            onChange={handleSearch}
          />
          <button className="add-stock-btn">Add Stock</button>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="empty-state">
          <p>Your watchlist is empty. Add stocks to start tracking them.</p>
        </div>
      ) : (
        <div className="watchlist-table">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
                <th>Volume</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWatchlist.map((stock) => (
                <tr key={stock.id}>
                  <td>{stock.symbol}</td>
                  <td>{stock.name}</td>
                  <td>₹{stock.price}</td>
                  <td>
                    <span className={`price-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change}%
                    </span>
                  </td>
                  <td>{stock.volume}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn buy">Buy</button>
                      <button className="action-btn remove">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Watchlist; 