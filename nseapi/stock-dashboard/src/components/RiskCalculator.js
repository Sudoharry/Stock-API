import React, { useState } from 'react';
import '../styles.css';

const RiskCalculator = () => {
  const [formData, setFormData] = useState({
    capital: '',
    stoplossPercentage: '',
    buyingPrice: '',
    stoplossPrice: ''
  });

  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const capital = parseFloat(formData.capital);
    const stoplossPercentage = parseFloat(formData.stoplossPercentage);
    const buyingPrice = parseFloat(formData.buyingPrice);
    const stoplossPrice = parseFloat(formData.stoplossPrice);

    // Calculate maximum quantity
    const riskAmount = (capital * stoplossPercentage) / 100;
    const priceRisk = buyingPrice - stoplossPrice;
    const maxQuantity = Math.floor(riskAmount / priceRisk);

    setResult({
      maxQuantity: maxQuantity,
      riskAmount: riskAmount,
      priceRisk: priceRisk
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card risk-calculator">
        <div className="card-header">
          <h2>Position Sizing Calculator</h2>
          <p className="subtitle">Calculate your optimal position size based on risk parameters</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Trading Capital</label>
            <div className="input-with-icon">
              <input
                type="number"
                name="capital"
                value={formData.capital}
                onChange={handleInputChange}
                placeholder="Enter your trading capital"
                required
              />
              <i className="input-icon fas fa-rupee-sign"></i>
            </div>
          </div>

          <div className="form-group">
            <label>Risk Percentage</label>
            <div className="input-with-icon">
              <input
                type="number"
                name="stoplossPercentage"
                value={formData.stoplossPercentage}
                onChange={handleInputChange}
                placeholder="Enter risk percentage"
                required
                step="0.01"
                min="0.01"
                max="100"
              />
              <i className="input-icon fas fa-percent"></i>
            </div>
          </div>

          <div className="form-group">
            <label>Entry Price</label>
            <div className="input-with-icon">
              <input
                type="number"
                name="buyingPrice"
                value={formData.buyingPrice}
                onChange={handleInputChange}
                placeholder="Enter entry price"
                required
                step="0.01"
              />
              <i className="input-icon fas fa-tag"></i>
            </div>
          </div>

          <div className="form-group">
            <label>Stop Loss Price</label>
            <div className="input-with-icon">
              <input
                type="number"
                name="stoplossPrice"
                value={formData.stoplossPrice}
                onChange={handleInputChange}
                placeholder="Enter stop loss price"
                required
                step="0.01"
              />
              <i className="input-icon fas fa-hand-paper"></i>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Calculate Position Size
          </button>
        </form>

        {result && (
          <div className="results-summary">
            <div className="result-item">
              <span className="result-label">Maximum Quantity</span>
              <span className="result-value">{result.maxQuantity}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Risk Amount</span>
              <span className="result-value">₹{result.riskAmount.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Price Risk</span>
              <span className="result-value">₹{result.priceRisk.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskCalculator; 