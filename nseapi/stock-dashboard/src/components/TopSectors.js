import React from 'react';

const TopSectors = ({ sectors = [] }) => {
  // Return early if no sectors data
  if (!sectors || sectors.length === 0) {
    return (
      <div className="sectors-container">
        <div className="card-header">
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
    .slice(0, 5); // Show top 5 sectors

  // Format percentage value
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.00';
    return Number(value).toFixed(2);
  };

  return (
    <div className="sectors-container">
      <div className="card-header">
        <h3>Top Performing Sectors</h3>
      </div>
      <div className="top-sectors-list">
        {sortedSectors.map((sector, index) => (
          <div key={index} className="top-sector-item">
            <div className="sector-rank">#{index + 1}</div>
            <div className="sector-info">
              <div className="sector-name">{sector.name || sector.sector || 'Unknown'}</div>
              <div className={`sector-performance ${sector.performance >= 0 ? 'positive' : 'negative'}`}>
                {sector.performance >= 0 ? '+' : ''}{formatPercentage(sector.performance)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSectors; 