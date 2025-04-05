import React from "react";

const StockTable = ({ stocks }) => {
  return (
    <div className="stocks-table">
      <h3>Top Performing Stocks</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Sector</th>
            <th>Price</th>
            <th>Change %</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => {
            // Debugging: Log each stock's data
            console.log("Stock Data:", stock);

            // Ensure the value is a valid number before using toFixed()
            const price = !isNaN(parseFloat(stock.current_price)) ? parseFloat(stock.current_price) : 0;
            const change = !isNaN(parseFloat(stock.change_percentage)) ? parseFloat(stock.change_percentage) : 0;

            return (
              <tr key={index}>
                <td>{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>{stock.sector}</td>
                {/* Format price with two decimal places */}
                <td>₹{price.toFixed(2)}</td>
                <td className={change >= 0 ? "positive" : "negative"}>
                  {change.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
