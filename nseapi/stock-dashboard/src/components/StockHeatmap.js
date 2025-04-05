import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles.css';

const StockHeatmap = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  
  const performanceRanges = [
    { id: 'above5', label: 'Above 5%', min: 5, max: Infinity },
    { id: '3to5', label: '3% to 5%', min: 3, max: 5 },
    { id: '1to3', label: '1% to 3%', min: 1, max: 3 },
    { id: '0to1', label: '0% to 1%', min: 0, max: 1 },
    { id: 'flat', label: 'Flat (0%)', min: 0, max: 0 },
    { id: 'minus1to0', label: '-1% to 0%', min: -1, max: 0 },
    { id: 'minus3to1', label: '-3% to -1%', min: -3, max: -1 },
    { id: 'minus5to3', label: '-5% to -3%', min: -5, max: -3 },
    { id: 'below5', label: 'Below -5%', min: -Infinity, max: -5 }
  ];

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }
        
        const response = await axios.get('http://localhost:8000/api/stocks/heatmap/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          setStocks(response.data);
        } else {
          setError('Invalid data format received from server');
        }
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError(`Failed to load stock data: ${err.message || 'Unknown error'}`);
        
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchStocks(), 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [retryCount]);

  // Calculate color based on performance
  const getColorByPerformance = (percentChange) => {
    if (percentChange > 5) return '#1a6e27'; // Darker green
    if (percentChange > 3) return '#2d9839'; // Medium green
    if (percentChange > 1) return '#4cc763'; // Light green
    if (percentChange > 0) return '#a0d8a4'; // Very light green
    if (percentChange === 0) return '#c5c5c5'; // Neutral
    if (percentChange > -1) return '#e0b2b6'; // Very light red
    if (percentChange > -3) return '#e6848c'; // Light red
    if (percentChange > -5) return '#d93f4c'; // Medium red
    return '#9a1824'; // Darker red
  };

  // Filter stocks by search query and selected performance
  const filteredStocks = stocks.filter(stock => {
    // Search filter
    const matchesSearch = !searchQuery || 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stock.name && stock.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Performance filter
    let matchesPerformance = true;
    if (selectedPerformance) {
      const range = performanceRanges.find(r => r.id === selectedPerformance);
      if (range) {
        if (range.id === 'flat') {
          matchesPerformance = Math.abs(stock.percent_change) < 0.01;
        } else {
          matchesPerformance = stock.percent_change >= range.min && stock.percent_change < range.max;
        }
      }
    }
    
    return matchesSearch && matchesPerformance;
  });

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePerformanceClick = (performanceId) => {
    setSelectedPerformance(selectedPerformance === performanceId ? null : performanceId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading heatmap...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i>
        {error}
        <button onClick={handleRetry} className="retry-btn">
          <i className="fas fa-sync"></i> Retry
        </button>
      </div>
    );
  }

  if (!stocks.length) {
    return (
      <div className="empty-state">
        <i className="fas fa-chart-area"></i>
        <h3>No Stock Data Available</h3>
        <p>There is no stock data available for the heatmap at this time.</p>
        <button onClick={handleRetry} className="retry-btn">
          <i className="fas fa-sync"></i> Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h2>Stock Heatmap</h2>
        
        <div className="heatmap-top-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <i className="fas fa-search"></i>
          </div>
          
          <div className="performance-dropdown">
            <button className="performance-dropdown-btn">
              <i className="fas fa-chart-line"></i>
              Performance Filter
              <i className="fas fa-caret-down"></i>
            </button>
            <div className="performance-dropdown-content">
              {performanceRanges.map(range => (
                <div 
                  key={range.id}
                  className={`performance-option ${selectedPerformance === range.id ? 'active' : ''}`}
                  onClick={() => handlePerformanceClick(range.id)}
                >
                  <div 
                    className="performance-color" 
                    style={{ 
                      backgroundColor: range.id === 'flat' ? '#c5c5c5' : 
                        range.min >= 0 ? getColorByPerformance(range.min + 0.1) : getColorByPerformance(range.max - 0.1)
                    }}
                  ></div>
                  <span>{range.label}</span>
                </div>
              ))}
              {selectedPerformance && (
                <div 
                  className="performance-option clear-option"
                  onClick={() => setSelectedPerformance(null)}
                >
                  <i className="fas fa-times"></i>
                  <span>Clear Filter</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <div className="legend-title">Performance</div>
        <div className="legend-scale">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#9a1824' }}></div>
            <span>-5%+</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#d93f4c' }}></div>
            <span>-3% to -5%</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#e6848c' }}></div>
            <span>-1% to -3%</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#e0b2b6' }}></div>
            <span>0% to -1%</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#c5c5c5' }}></div>
            <span>0%</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#a0d8a4' }}></div>
            <span>0% to 1%</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#4cc763' }}></div>
            <span>1% to 3%</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#2d9839' }}></div>
            <span>3% to 5%</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#1a6e27' }}></div>
            <span>5%+</span>
          </div>
        </div>
      </div>

      <div className="heatmap-stats">
        <div className="heatmap-stat">
          <span className="stat-label">Total Stocks:</span>
          <span className="stat-value">{stocks.length}</span>
        </div>
        <div className="heatmap-stat">
          <span className="stat-label">Filtered Stocks:</span>
          <span className="stat-value">{filteredStocks.length}</span>
        </div>
        <div className="heatmap-stat">
          <span className="stat-label">Gainers:</span>
          <span className="stat-value positive">{stocks.filter(s => s.percent_change > 0).length}</span>
        </div>
        <div className="heatmap-stat">
          <span className="stat-label">Losers:</span>
          <span className="stat-value negative">{stocks.filter(s => s.percent_change < 0).length}</span>
        </div>
        {selectedPerformance && (
          <div className="heatmap-stat active-filter">
            <span className="stat-label">Active Filter:</span>
            <span className="stat-value">
              {performanceRanges.find(r => r.id === selectedPerformance)?.label}
              <button 
                className="clear-filter-btn" 
                onClick={() => setSelectedPerformance(null)}
                title="Clear filter"
              >
                <i className="fas fa-times"></i>
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="heatmap-grid">
        {filteredStocks.length === 0 ? (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <p>No stocks match your current filters. Try adjusting your search criteria.</p>
          </div>
        ) : (
          filteredStocks.map(stock => (
            <div 
              key={stock.symbol}
              className="heatmap-tile"
              style={{ 
                backgroundColor: getColorByPerformance(stock.percent_change),
                borderColor: stock.percent_change >= 0 ? '#269f42' : '#e34c26'
              }}
            >
              <div className="tile-symbol">{stock.symbol}</div>
              <div className="tile-price">₹{stock.price.toFixed(2)}</div>
              <div className={`tile-change ${stock.percent_change >= 0 ? 'positive' : 'negative'}`}>
                {stock.percent_change >= 0 ? '+' : ''}{stock.percent_change.toFixed(2)}%
              </div>
              <div className="tile-sector">{stock.sector || 'Unknown'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StockHeatmap; 