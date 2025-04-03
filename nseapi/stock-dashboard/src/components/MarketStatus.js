import React, { useState, useEffect } from 'react';
import '../styles.css';

const MarketStatus = ({ status }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  });

  return (
    <div className="market-status-display">
      <div className={`status-pill ${status === "Open" ? "positive" : "negative"}`}>
        {status || "Closed"}
      </div>
      <div className="market-time">
        {formattedTime}
      </div>
    </div>
  );
};

export default MarketStatus; 