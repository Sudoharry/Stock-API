import React, { useEffect } from 'react';

const TopSectors = ({ sectors = [] }) => {
  // Add debugging output when component renders
  useEffect(() => {
    if (sectors && sectors.length > 0) {
      console.log('TopSectors component received data:', sectors);
      console.log('First sector sample:', sectors[0]);
    }
  }, [sectors]);

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

  // Normalize sector data to handle different API response formats
  const normalizedSectors = sectors.map(sector => {
    // Extract performance data, checking all possible property names
    let changePercentage = 0;
    
    // First check direct properties
    if (typeof sector.change_percentage === 'number') {
      changePercentage = sector.change_percentage;
    } else if (typeof sector.performance === 'number') {
      changePercentage = sector.performance;
    }
    // Then try parsing string values if needed
    else if (typeof sector.change_percentage === 'string') {
      changePercentage = parseFloat(sector.change_percentage) || 0;
    } else if (typeof sector.performance === 'string') {
      changePercentage = parseFloat(sector.performance) || 0;
    }
    
    return {
      name: sector.name || sector.sector || 'Unknown',
      change_percentage: changePercentage
    };
  });

  console.log('Normalized sectors data:', normalizedSectors);

  // Sort sectors by change_percentage (highest to lowest)
  const sortedSectors = [...normalizedSectors]
    .sort((a, b) => Math.abs(b.change_percentage || 0) - Math.abs(a.change_percentage || 0))
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
              <div className="sector-name">{sector.name}</div>
              <div className={`sector-performance ${sector.change_percentage >= 0 ? 'positive' : 'negative'}`}>
                {sector.change_percentage >= 0 ? '+' : ''}{formatPercentage(sector.change_percentage)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSectors; 