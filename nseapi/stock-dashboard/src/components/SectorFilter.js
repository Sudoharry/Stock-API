import React from 'react';

const SectorFilter = ({ sectors = [], selectedSector, onSectorChange, sectorCounts = {} }) => {
  // Get the count for each sector, defaulting to 0 if not available
  const getSectorCount = (sector) => {
    return sectorCounts[sector] || 0;
  };

  return (
    <div className="sector-filter">
      <h3>Filter by Sector</h3>
      <div className="sector-options">
        {sectors.map((sector) => (
          <button
            key={sector}
            className={`sector-option ${selectedSector === sector ? 'active' : ''}`}
            onClick={() => onSectorChange(sector)}
          >
            {sector}
            <span className="sector-count">{getSectorCount(sector)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SectorFilter;
