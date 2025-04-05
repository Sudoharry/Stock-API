import React from 'react';

const TopSectors = ({ sectors = [] }) => {
  // Return early if no sectors data
  if (!sectors || sectors.length === 0) {
    return (
      <div className="sectors-container">
        <div className="sectors-header">
          <h3>Top Performing Sectors</h3>
        </div>
        <div className="sectors-content">
          <p>No sector data available</p>
        </div>
      </div>
    );
  }

  // Sort sectors by performance (highest to lowest)
  const sortedSectors = [...sectors]
    .sort((a, b) => Math.abs(b.performance || 0) - Math.abs(a.performance || 0))
    .slice(0, 5); // Show top 5 for better visualization

  // Format percentage value
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.00';
    return Number(value).toFixed(2);
  };

  return (
    <div className="sectors-container">
      <div className="sectors-header">
        <h3>Top Performing Sectors</h3>
      </div>
      <div className="top-sectors-layout">
        {/* Left Column - Percentages */}
        <div className="percentages-column">
          {sortedSectors.map((sector, index) => (
            <div 
              key={`badge-${index}`} 
              className={`percentage-badge ${sector.performance >= 0 ? 'positive' : 'negative'}`}
            >
              {formatPercentage(sector.performance)}%
            </div>
          ))}
        </div>

        {/* Right Column - Table */}
        <div className="sectors-table-wrapper">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {sortedSectors.map((sector, index) => (
                <tr key={`row-${index}`}>
                  <td>{sector.name || 'Unknown'}</td>
                  <td className={sector.performance >= 0 ? 'positive' : 'negative'}>
                    {formatPercentage(sector.performance)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopSectors; 