import React, { useState, useEffect } from "react";
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from "./components/Dashboard";
import TopSectors from "./components/TopSectors";
import FullStockList from "./components/FullStockList";
import SectorFilter from "./components/SectorFilter";
import TopStocks from './components/TopStocks';
import MarketStatus from './components/MarketStatus';
import Login from './components/Login';
import Register from './components/Register';
import Portfolio from './components/Portfolio';
import Watchlist from './components/Watchlist';
import axios from "axios";
import "./styles.css";

// Base URL for API calls
const API_BASE_URL = "http://127.0.0.1:8000/api";

const App = () => {
  const [stocks, setStocks] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [topSectors, setTopSectors] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSector, setSelectedSector] = useState("All");
  const [sectors, setSectors] = useState(["All"]);
  const [dashboardData, setDashboardData] = useState({
    totalStocks: 0,
    marketStatus: "Closed",
    gainersCount: 0,
    losersCount: 0
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Count stocks by sector
  const sectorCounts = React.useMemo(() => {
    if (!stocks || !stocks.length) return {};
    
    const counts = { "All": stocks.length };
    stocks.forEach(stock => {
      const sector = stock.sector || "Unknown";
      counts[sector] = (counts[sector] || 0) + 1;
    });
    
    return counts;
  }, [stocks]);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all stocks
        const stocksResponse = await axios.get(`${API_BASE_URL}/stocks/`);
        console.log('Raw stocks response:', stocksResponse);

        // Validate stocks data
        if (!stocksResponse.data || !Array.isArray(stocksResponse.data)) {
          console.error('Invalid stocks data:', stocksResponse.data);
          throw new Error('Invalid stocks data received from server');
        }

        // Process stocks data
        const processedStocks = stocksResponse.data.map(stock => ({
          symbol: stock.symbol || 'N/A',
          name: stock.name || 'N/A',
          sector: stock.sector || 'Unknown',
          current_price: parseFloat(stock.current_price) || 0,
          change_percentage: parseFloat(stock.change_percentage) || 0
        }));

        console.log('Processed stocks:', processedStocks);

        setStocks(processedStocks);
        setFilteredStocks(processedStocks);

        // Extract and set sectors
        const uniqueSectors = [...new Set(processedStocks
          .map(stock => stock.sector)
          .filter(sector => sector && sector !== 'N/A')
        )];
        setSectors(['All', ...uniqueSectors.sort()]);

        // Fetch dashboard data
        const dashboardResponse = await axios.get(`${API_BASE_URL}/stocks/dashboard-data/`);
        console.log('Dashboard response:', dashboardResponse.data);
        
        if (dashboardResponse.data) {
          setDashboardData({
            totalStocks: dashboardResponse.data.totalStocks || 0,
            marketStatus: dashboardResponse.data.marketStatus || "Closed",
            gainersCount: dashboardResponse.data.gainersCount || 0,
            losersCount: dashboardResponse.data.losersCount || 0
          });
        }

        // Fetch top performers
        const topResponse = await axios.get(`${API_BASE_URL}/stocks/top_performers/`);
        if (Array.isArray(topResponse.data)) {
          setTopStocks(topResponse.data);
        }

        // Fetch sectors performance
        const sectorsResponse = await axios.get(`${API_BASE_URL}/stocks/sectors/`);
        if (Array.isArray(sectorsResponse.data)) {
          setTopSectors(sectorsResponse.data);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Filter stocks by sector
  useEffect(() => {
    if (!Array.isArray(stocks)) return;
    
    if (selectedSector === "All") {
      setFilteredStocks(stocks);
    } else {
      setFilteredStocks(stocks.filter(stock => stock.sector === selectedSector));
    }
  }, [selectedSector, stocks]);

  // Handle sector selection
  const handleSectorChange = (sector) => {
    setSelectedSector(sector);
    // Scroll to stock list for better UX
    const stockList = document.querySelector('.stock-list-container');
    if (stockList) {
      stockList.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', userData.token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading stock data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <>
                <Dashboard data={dashboardData} />
                <div className="dashboard-grid">
                  <MarketStatus status={dashboardData.marketStatus} />
                  <TopStocks stocks={stocks.slice(0, 5)} />
                  <TopSectors sectors={topSectors} />
                </div>
              </>
            } />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
            } />
            <Route path="/portfolio" element={
              <PrivateRoute>
                <Portfolio />
              </PrivateRoute>
            } />
            <Route path="/watchlist" element={
              <PrivateRoute>
                <Watchlist />
              </PrivateRoute>
            } />
            <Route path="/stocks" element={
              <>
                <Dashboard data={dashboardData} />
                <div className="content">
                  <TopSectors sectors={topSectors} />
                  <div className="stock-section">
                    <SectorFilter
                      sectors={sectors}
                      selectedSector={selectedSector}
                      onSectorChange={handleSectorChange}
                      sectorCounts={sectorCounts}
                    />
                    <div className="filtered-stock-info">
                      <h4>
                        {selectedSector === "All" 
                          ? "Showing all stocks" 
                          : `Showing ${filteredStocks.length} stocks in ${selectedSector} sector`}
                      </h4>
                    </div>
                    <FullStockList 
                      stocks={filteredStocks || []} 
                    />
                  </div>
                </div>
              </>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;