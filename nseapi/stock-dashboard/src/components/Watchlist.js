import React, { useState, useEffect } from 'react';
import AddToWatchlist from './AddToWatchlist';
import '../styles.css';

const Watchlist = () => {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingStocks, setAddingStocks] = useState([]);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // Add debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('You must be logged in to search stocks');
      }

      const upperQuery = query.trim().toUpperCase();
      const response = await fetch(
        `http://127.0.0.1:8000/api/stocks/search_stocks/?query=${encodeURIComponent(upperQuery)}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        }
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch search results');
      }

      if (Array.isArray(data)) {
        const processedData = data.map(stock => ({
          ...stock,
          current_price: parseFloat(stock.current_price) || 0,
          change_percentage: parseFloat(stock.change_percentage) || 0
        }));

        setSearchResults(processedData);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromSearch = async (stock) => {
    try {
      setAddingStocks(prev => [...prev, stock.symbol]);
      setError('');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('You must be logged in to add stocks to watchlist');
      }

      const response = await fetch('http://127.0.0.1:8000/api/watchlist/add/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          current_price: stock.current_price,
          change_percentage: stock.change_percentage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add stock to watchlist');
      }

      const formattedStock = {
        id: data.id || Date.now(),
        symbol: stock.symbol,
        companyName: stock.name,
        currentPrice: stock.current_price,
        priceChange: stock.change_percentage,
        targetPrice: '',
        notes: ''
      };

      setWatchlistItems(prev => [...prev, formattedStock]);
      setSearchQuery(''); // Clear search after adding
      setSearchResults([]); // Clear results after adding
    } catch (err) {
      console.error('Error adding stock:', err);
      setError(err.message);
    } finally {
      setAddingStocks(prev => prev.filter(symbol => symbol !== stock.symbol));
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/watchlist/', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      // Check content type first
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch watchlist');
      }

      // Ensure data is an array and format it properly
      const formattedData = Array.isArray(data) ? data.map(item => ({
        id: item.id || Date.now(),
        symbol: item.symbol,
        companyName: item.name || item.companyName,
        currentPrice: parseFloat(item.current_price || item.currentPrice) || 0,
        priceChange: parseFloat(item.change_percentage || item.priceChange) || 0,
        targetPrice: item.target_price || item.targetPrice || '',
        notes: item.notes || ''
      })) : [];

      setWatchlistItems(formattedData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred while fetching the watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = (newStock) => {
    // Ensure the new stock has all required fields
    const formattedStock = {
      ...newStock,
      id: newStock.id || Date.now(),
      companyName: newStock.companyName || newStock.name,
      currentPrice: parseFloat(newStock.currentPrice || newStock.current_price) || 0,
      priceChange: parseFloat(newStock.priceChange || newStock.change_percentage) || 0,
      targetPrice: newStock.targetPrice || '',
      notes: newStock.notes || ''
    };
    setWatchlistItems(prev => [...prev, formattedStock]);
  };

  const handleRemoveStock = async (stockId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/watchlist/${stockId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setWatchlistItems(prev => prev.filter(item => item.id !== stockId));
      } else {
        setError('Failed to remove stock from watchlist');
      }
    } catch (err) {
      console.error('Remove error:', err);
      setError('An error occurred while removing the stock');
    }
  };

  const filteredItems = watchlistItems.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="watchlist-container">
        <div className="loading">Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div className="watchlist-container" style={{ background: '#f8fafc', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
      <div className="watchlist-header" style={{ 
        background: '#ffffff', 
        padding: '1.5rem', 
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ 
          color: '#1e293b', 
          fontSize: '1.75rem', 
          fontWeight: '700',
          margin: '0'
        }}>My Watchlist</h2>
        <div className="search-box" style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          position: 'relative',
          flex: '0 0 400px'
        }}>
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              color: '#1e293b',
              background: '#ffffff',
              transition: 'all 0.2s ease'
            }}
          />
          {searchQuery && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: '0',
              right: '0',
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e2e8f0',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10
            }}>
              {searchResults.map(stock => (
                <div
                  key={stock.symbol}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    ':hover': {
                      backgroundColor: '#f8fafc'
                    }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{stock.symbol}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{stock.name}</div>
                  </div>
                  <button
                    onClick={() => handleAddFromSearch(stock)}
                    disabled={addingStocks.includes(stock.symbol) || watchlistItems.some(item => item.symbol === stock.symbol)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: watchlistItems.some(item => item.symbol === stock.symbol) ? '#94a3b8' : '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: watchlistItems.some(item => item.symbol === stock.symbol) ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {watchlistItems.some(item => item.symbol === stock.symbol) 
                      ? 'Added' 
                      : addingStocks.includes(stock.symbol) 
                        ? 'Adding...' 
                        : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
          <button 
            className="add-stock-btn" 
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap'
            }}
          >
            Add Stock
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {watchlistItems.length === 0 ? (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1.125rem' }}>
            Your watchlist is empty. Add some stocks to track!
          </p>
          <button 
            className="add-stock-btn" 
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add Your First Stock
          </button>
        </div>
      ) : (
        <div className="watchlist-table" style={{
          background: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead style={{ background: '#1e1b4b', color: '#ffffff' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'left', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Symbol</th>
                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'left', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Company Name</th>
                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'left', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Current Price</th>
                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'left', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Change</th>
                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'left', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Target Price</th>
                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'left', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Notes</th>
                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'left', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} style={{ transition: 'all 0.2s ease' }}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#1e1b4b' }}>
                    {item.symbol}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                    {item.companyName}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                    ₹{item.currentPrice.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid #e2e8f0',
                    color: item.priceChange >= 0 ? '#16a34a' : '#dc2626',
                    fontWeight: '600'
                  }}>
                    {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(2)}%
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                    {item.targetPrice ? `₹${item.targetPrice}` : '—'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                    {item.notes || '—'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="action-btn buy"
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Buy
                      </button>
                      <button
                        className="action-btn remove"
                        onClick={() => handleRemoveStock(item.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
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
          <AddToWatchlist
            onAdd={handleAddStock}
            onClose={() => setShowAddForm(false)}
          />
      )}
    </div>
  );
};

export default Watchlist; 