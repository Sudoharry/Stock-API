import React, { useState, useEffect } from "react";

const FullStockList = ({ stocks }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const stocksPerPage = 10;

  // Validate stocks prop and ensure all required fields exist
  const validStocks = Array.isArray(stocks) ? stocks.map(stock => ({
    symbol: stock?.symbol || 'N/A',
    name: stock?.name || 'N/A',
    sector: stock?.sector || 'Unknown',
    current_price: stock?.current_price !== undefined ? Number(stock.current_price) : 0,
    change_percentage: stock?.change_percentage !== undefined ? Number(stock.change_percentage) : 0
  })) : [];

  // Debugging logs to identify potential issues
  useEffect(() => {
    console.log("Stocks received:", stocks);
    validStocks.forEach((stock, index) => {
      if (stock.current_price === undefined || stock.change_percentage === undefined) {
        console.warn(`Stock at index ${index} has undefined values:`, stock);
      }
    });
  }, [stocks]);

  // Calculate total pages
  const totalPages = Math.ceil(validStocks.length / stocksPerPage);

  // Get current stocks for the page
  const startIndex = (currentPage - 1) * stocksPerPage;
  const currentStocks = validStocks.slice(startIndex, startIndex + stocksPerPage);

  // Safe number formatting
  const formatNumber = (value) => {
    // Convert to number if it's a string, or default to 0
    const num = value === undefined || value === null ? 0 : Number(value);
    // Check if the result is a valid number
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Return early if no stocks data
  if (!validStocks.length) {
    return (
      <div className="stock-list-container">
        <div className="stock-list-header">
          <h3>All Stocks</h3>
        </div>
        <div className="stock-list-content">
          <p>No stock data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-list-container">
      <div className="stock-list-header">
        <h3>All Stocks</h3>
      </div>
      <div className="stock-list-content">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Sector</th>
              <th>Price (₹)</th>
              <th>Change (%)</th>
            </tr>
          </thead>
          <tbody>
            {currentStocks.map((stock, index) => (
              <tr key={index}>
                <td>{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>{stock.sector}</td>
                <td>₹{formatNumber(stock.current_price)}</td>
                <td className={Number(stock.change_percentage) >= 0 ? 'positive' : 'negative'}>
                  {Number(stock.change_percentage) >= 0 ? '+' : ''}{formatNumber(stock.change_percentage)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FullStockList;