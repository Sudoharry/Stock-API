import React, { useState } from 'react';
import '../styles.css';

const AddToWatchlist = ({ onAdd, onClose }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [addingStocks, setAddingStocks] = useState([]);

  const handleChange = (e) => {
    const { value } = e.target;
    setSearchQuery(value);
    
    // Clear any existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set a new timeout
    window.searchTimeout = setTimeout(() => {
      handleSearch(value);
    }, 300); // 300ms delay
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setIsLoading(true);
    setError(null);
    
    if (!query.trim()) {
      setSearchResults({});
      setIsLoading(false);
      return;
    }

    try {
      console.log('Searching for:', query.trim()); // Debug log
      const searchUrl = `http://127.0.0.1:8000/api/stocks/search/?query=${encodeURIComponent(query.trim())}`;
      console.log('Search URL:', searchUrl); // Debug log
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status); // Debug log
      console.log('Response headers:', Object.fromEntries(response.headers.entries())); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText); // Debug log
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API Response:', data); // Debug log
      
      // Check if data is an array
      if (Array.isArray(data)) {
        if (data.length === 0) {
          console.log('No results found'); // Debug log
          setSearchResults({});
          return;
        }

        // Group results by type (Index vs Stock)
        const groupedResults = data.reduce((acc, stock) => {
          try {
            // Clean and validate the data, converting string numbers to actual numbers
            const cleanStock = {
              ...stock,
              current_price: stock.current_price ? parseFloat(stock.current_price) : null,
              change_percentage: stock.change_percentage ? parseFloat(stock.change_percentage) : null,
              symbol: stock.symbol?.trim(),
              name: stock.name?.trim(),
              sector: stock.sector?.trim() || 'Other'
            };

            // Determine the type based on symbol or other criteria
            const type = cleanStock.symbol?.includes('INDEX') ? 'Indices' : 'Stocks';
            
            if (!acc[type]) {
              acc[type] = [];
            }
            acc[type].push(cleanStock);
          } catch (err) {
            console.error('Error processing stock:', stock, err); // Debug log
          }
          return acc;
        }, {});

        console.log('Processed search results:', groupedResults); // Debug log
        setSearchResults(groupedResults);
      } else {
        console.error('Invalid response format:', data);
        setSearchResults({});
        setError('Invalid response format from server');
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search stocks');
      setSearchResults({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = async (stock) => {
    try {
      setAddingStocks(prev => [...prev, stock.symbol]);
      setError('');
      
      const response = await fetch('http://127.0.0.1:8000/api/watchlist/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          current_price: stock.current_price,
          change_percentage: stock.change_percentage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to add stock to watchlist');
      }

      onAdd(data);
      onClose();
    } catch (err) {
      console.error('Error adding stock:', err);
      setError(err.message || 'Failed to add stock to watchlist. Please try again.');
    } finally {
      setAddingStocks(prev => prev.filter(symbol => symbol !== stock.symbol));
    }
  };

  const filteredResults = activeFilter === 'all' 
    ? searchResults 
    : Object.entries(searchResults).reduce((acc, [category, stocks]) => {
        if (category.toLowerCase() === activeFilter) {
          acc[category] = stocks;
        }
        return acc;
      }, {});

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-card watchlist-form">
        <h2>
          Add symbol
          <button onClick={onClose} title="Close">×</button>
        </h2>
        
        <div className="filter-pills">
          <button 
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-pill ${activeFilter === 'stocks' ? 'active' : ''}`}
            onClick={() => setActiveFilter('stocks')}
          >
            Stocks
          </button>
          <button 
            className={`filter-pill ${activeFilter === 'indices' ? 'active' : ''}`}
            onClick={() => setActiveFilter('indices')}
          >
            Indices
          </button>
        </div>

        <div className="form-group">
          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            placeholder="Search stocks..."
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="search-results">
          {isLoading ? (
            <div className="search-category">
              <div className="loading">Searching...</div>
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          ) : searchQuery && Object.keys(filteredResults).length === 0 ? (
            <div className="search-category">
              <div className="no-results">No results found</div>
            </div>
          ) : (
            Object.entries(filteredResults).map(([category, stocks]) => (
              <div key={category} className="search-category">
                <h3>{category} ({stocks.length})</h3>
                {stocks.map((stock) => (
                  <div key={stock.symbol} className="search-result-item">
                    <div className="stock-info">
                      <span className="stock-symbol">{stock.symbol}</span>
                      <span className="stock-name">{stock.name || 'Unknown'}</span>
                      <span className="stock-exchange">{stock.sector || 'Other'}</span>
                    </div>
                    <div className="stock-price">
                      <span className="current-price">
                        {stock.current_price != null ? `₹${stock.current_price.toFixed(2)}` : 'N/A'}
                      </span>
                      {stock.change_percentage != null && (
                        <span className={`change-percent ${stock.change_percentage >= 0 ? 'positive' : 'negative'}`}>
                          {stock.change_percentage >= 0 ? '+' : ''}
                          {stock.change_percentage.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <button
                      className="add-btn"
                      onClick={() => handleAddStock(stock)}
                      disabled={addingStocks.includes(stock.symbol)}
                      title="Add to watchlist"
                    >
                      {addingStocks.includes(stock.symbol) ? (
                        <span className="loading-indicator">...</span>
                      ) : (
                        <span>+</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToWatchlist; 