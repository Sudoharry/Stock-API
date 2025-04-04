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
import Profile from './components/Profile';
import RiskCalculator from './components/RiskCalculator';
import StockHeatmap from './components/StockHeatmap';
import ChatRoom from './components/ChatRoom';
import ChatWidget from './components/ChatWidget';
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
    market_status: "Closed",
    gainersCount: 0,
    losersCount: 0
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  
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

        // Sort stocks by change percentage to get top performers
        const sortedStocks = [...processedStocks].sort((a, b) => b.change_percentage - a.change_percentage);
        const topTenStocks = sortedStocks.slice(0, 10);

        console.log('Processed stocks:', processedStocks);
        console.log('Top performers:', topTenStocks);

        setStocks(processedStocks);
        setFilteredStocks(processedStocks);
        setTopPerformers(topTenStocks);

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
            totalStocks: dashboardResponse.data.stats?.total_stocks || 0,
            market_status: dashboardResponse.data.stats?.market_status || "Closed",
            gainersCount: dashboardResponse.data.stats?.gainers_count || 0,
            losersCount: dashboardResponse.data.stats?.losers_count || 0,
            sector_performance: dashboardResponse.data.sector_performance || []
          });
        }

        // Fetch top performers
        const topResponse = await axios.get(`${API_BASE_URL}/stocks/top_performers/`);
        if (Array.isArray(topResponse.data)) {
          setTopStocks(topResponse.data);
        }

        // Fetch sectors performance
        const sectorsResponse = await axios.get(`${API_BASE_URL}/stocks/sectors/`);
        console.log('Sectors response:', sectorsResponse.data);
        
        // Handle different possible response formats
        if (sectorsResponse.data) {
          let sectorsData = [];
          
          // Check if the data is in {sectors: [...]} format
          if (sectorsResponse.data.sectors && Array.isArray(sectorsResponse.data.sectors)) {
            sectorsData = sectorsResponse.data.sectors;
          } 
          // Check if data is an array directly
          else if (Array.isArray(sectorsResponse.data)) {
            sectorsData = sectorsResponse.data;
          }
          // Fallback to dashboard data's sector performance
          else if (dashboardResponse.data && dashboardResponse.data.sector_performance) {
            sectorsData = dashboardResponse.data.sector_performance;
          }
          
          // Ensure we have valid data before setting state
          if (sectorsData.length > 0) {
            console.log('Setting top sectors data:', sectorsData);
            setTopSectors(sectorsData);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStockData();

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchStockData, 60000); // Refresh every minute

    // Cleanup function to clear interval when component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array means this effect runs once on mount

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

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsAuthenticated(true);
      setUser(JSON.parse(user));
    }
  }, []);

  const handleLogin = (data) => {
    setIsAuthenticated(true);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await fetch('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  // Add axios interceptor for token refresh
  useEffect(() => {
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh: refreshToken
            });

            if (response.data.access) {
              localStorage.setItem('access_token', response.data.access);
              axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
              originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            handleLogout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }, []);

  // Add auth header to all axios requests
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [isAuthenticated]);

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
                <div className="dashboard-stats">
                  <div className="dashboard">
                    <div className="dashboard-card">
                      <h3>Total Stocks</h3>
                      <div className="dashboard-number">{dashboardData.totalStocks}</div>
                    </div>
                    <div className="dashboard-card">
                      <h3>Market Performance</h3>
                      <div className="performance-container">
                        <div className="performance positive">
                          <span>{dashboardData.gainersCount}</span>
                          <span className="label">Gainers</span>
                        </div>
                        <div className="performance negative">
                          <span>{dashboardData.losersCount}</span>
                          <span className="label">Losers</span>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-card">
                      <h3>Market Status</h3>
                      <MarketStatus status={dashboardData.market_status} />
                    </div>
                  </div>
                </div>
                <div className="dashboard-grid">
                  <div className="top-stocks-container">
                    <TopStocks stocks={topPerformers} loading={loading} error={error} />
                  </div>
                  <div className="top-sectors-container">
                    <TopSectors sectors={topSectors} loading={loading} error={error} />
                  </div>
                </div>
              </>
            } />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile user={user} />
              </PrivateRoute>
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
            <Route path="/chatroom" element={
              <PrivateRoute>
                <ChatRoom user={user} />
              </PrivateRoute>
            } />
            <Route path="/risk-calculator" element={
              <PrivateRoute>
                <RiskCalculator />
              </PrivateRoute>
            } />
            <Route path="/heatmap" element={
              <PrivateRoute>
                <StockHeatmap />
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
        <Footer user={user} />
        {isAuthenticated && user && <ChatWidget user={user} />}
      </div>
    </BrowserRouter>
  );
};

export default App;