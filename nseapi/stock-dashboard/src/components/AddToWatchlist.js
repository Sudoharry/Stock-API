import React, { useState } from 'react';
import '../styles.css';

const AddToWatchlist = ({ onAdd, onClose }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      if (value.trim()) {
        handleSearch(value);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms delay
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the access token
      let token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('You must be logged in to search stocks');
      }

      const upperQuery = query.trim().toUpperCase();
      
      const makeRequest = async (accessToken) => {
        const response = await fetch(
          `http://127.0.0.1:8000/api/stocks/search_stocks/?query=${encodeURIComponent(upperQuery)}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
          }
        );
        return response;
      };

      // First attempt with current token
      let response = await makeRequest(token);

      // If unauthorized, try to refresh token and retry request
      if (response.status === 401) {
        try {
          token = await refreshToken();
          response = await makeRequest(token);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Only logout if refresh token fails
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      }

      // Check if redirected to login page
      if (response.redirected) {
        throw new Error('Session expired. Please log in again.');
      }

      // Check response status and content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Please check if you\'re logged in.');
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          // Only logout for forbidden (not for unauthorized which we handle above)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(data.error || 'Failed to fetch search results');
      }

      if (Array.isArray(data)) {
        const processedData = data.map(stock => ({
          ...stock,
          current_price: parseFloat(stock.current_price) || 0,
          change_percentage: parseFloat(stock.change_percentage) || 0,
          sector: stock.sector || 'Other'
        }));

        const sortedResults = processedData.sort((a, b) => {
          const aSymbol = a.symbol.toUpperCase();
          const bSymbol = b.symbol.toUpperCase();
          
          if (aSymbol === upperQuery && bSymbol !== upperQuery) return -1;
          if (bSymbol === upperQuery && aSymbol !== upperQuery) return 1;
          
          if (aSymbol.startsWith(upperQuery) && !bSymbol.startsWith(upperQuery)) return -1;
          if (bSymbol.startsWith(upperQuery) && !aSymbol.startsWith(upperQuery)) return 1;
          
          return aSymbol.localeCompare(bSymbol);
        });

        setSearchResults(sortedResults);
      } else {
        setSearchResults([]);
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
      setSearchResults([]);
      
      // Only redirect to login if it's an authentication error and we haven't already handled it
      if (err.message.includes('must be logged in')) {
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('http://127.0.0.1:8000/api/auth/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          refresh: refresh
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      localStorage.setItem('access_token', data.access);
      return data.access;
    } catch (error) {
      throw error;
    }
  };

  const handleAddStock = async (stock) => {
    try {
      setAddingStocks(prev => [...prev, stock.symbol]);
      setError('');
      
      // Check for authentication
      let token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('You must be logged in to add stocks to watchlist');
      }

      // Get CSRF token from cookie if it exists
      const csrfToken = document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      const makeRequest = async (accessToken) => {
        const response = await fetch('http://127.0.0.1:8000/api/watchlist/add/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'X-CSRFToken': csrfToken || ''
          },
          credentials: 'include',
          body: JSON.stringify({
            symbol: stock.symbol,
            name: stock.name,
            current_price: stock.current_price,
            change_percentage: stock.change_percentage
          }),
        });
        return response;
      };

      // First attempt with current token
      let response = await makeRequest(token);

      // If unauthorized, try to refresh token and retry request
      if (response.status === 401) {
        try {
          token = await refreshToken();
          response = await makeRequest(token);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Only logout if refresh token fails
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      }

      // Check if redirected to login page
      if (response.redirected) {
        throw new Error('Session expired. Please log in again.');
      }

      // Check response status and content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Please check if you\'re logged in.');
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          // Only logout for forbidden (not for unauthorized which we handle above)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(data.error || data.message || 'Failed to add stock to watchlist');
      }

      // Format the data to match the watchlist table structure
      const formattedData = {
        id: data.id || Date.now(),
        symbol: stock.symbol,
        companyName: stock.name,
        currentPrice: stock.current_price,
        priceChange: stock.change_percentage,
        targetPrice: '',
        notes: ''
      };

      onAdd(formattedData);
      onClose();
    } catch (err) {
      console.error('Error adding stock:', err);
      setError(err.message);
      
      // Only redirect to login if it's an authentication error and we haven't already handled it
      if (err.message.includes('must be logged in')) {
        window.location.href = '/login';
      }
    } finally {
      setAddingStocks(prev => prev.filter(symbol => symbol !== stock.symbol));
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-card watchlist-form">
        <div className="modal-header">
          <h2>Add symbol</h2>
          <button className="close-button" onClick={onClose} title="Close">×</button>
          </div>

        <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={handleChange}
            placeholder="Search..."
            className="search-input"
              autoComplete="off"
            autoFocus
          />
        </div>

        <div className="search-results-container">
          {isLoading ? (
            <div className="loading-indicator">Searching...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : searchResults.length > 0 ? (
            <div className="results-list">
                {searchResults.map((stock) => (
                <div key={stock.symbol} className="stock-result-item">
                  <div className="stock-info-container">
                    <div className="stock-main-info">
                      <span className="stock-symbol-large">{stock.symbol}</span>
                    </div>
                    <div className="stock-description">{stock.name}</div>
                  </div>
                  <div className="stock-metrics">
                    <span className="stock-exchange">NSE</span>
                    <div className={`price-change ${stock.change_percentage >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change_percentage >= 0 ? '+' : ''}{stock.change_percentage.toFixed(2)}%
                    </div>
                    <button
                      className="add-button"
                      onClick={() => handleAddStock(stock)}
                      disabled={addingStocks.includes(stock.symbol)}
                    >
                      {addingStocks.includes(stock.symbol) ? '...' : '+'}
                    </button>
                  </div>
                  </div>
                ))}
              </div>
          ) : searchQuery ? (
            <div className="no-results">No stocks found</div>
          ) : null}
          </div>
      </div>
    </div>
  );
};

export default AddToWatchlist; 

// Replace the existing styles with updated ones
const styles = `
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.auth-card {
  background-color: #ffffff;
  border-radius: 8px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 16px;
  color: #333333;
  margin: 0;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: #666666;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}

.close-button:hover {
  color: #333333;
}

.search-container {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #ffffff;
  color: #333333;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #3179f5;
}

.search-input::placeholder {
  color: #999999;
}

.search-results-container {
  flex: 1;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

.stock-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  transition: all 0.2s;
  background-color: #ffffff;
}

.stock-result-item:hover {
  background-color: #f5f5f5;
}

.stock-info-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stock-main-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stock-symbol-large {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  letter-spacing: 0.2px;
}

.stock-description {
  font-size: 12px;
  color: #666666;
}

.stock-metrics {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stock-exchange {
  font-size: 11px;
  color: #666666;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: #f0f0f0;
  text-transform: uppercase;
}

.price-change {
  font-size: 13px;
  font-weight: 500;
  min-width: 65px;
  text-align: right;
  color: #333333;
}

.price-change.positive {
  color: #26a69a;
}

.price-change.negative {
  color: #ef5350;
}

.add-button {
  background-color: transparent;
  border: none;
  color: #666666;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: 4px;
}

.add-button:hover {
  background-color: #f0f0f0;
  color: #333333;
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-indicator {
  padding: 16px;
  text-align: center;
  color: #666666;
}

.error-message {
  padding: 16px;
  text-align: center;
  color: #ef5350;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #666666;
}
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet); 