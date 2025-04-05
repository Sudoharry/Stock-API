import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor for authentication
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for token refresh
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post('/auth/token/refresh/', {
                    refresh: refreshToken
                });
                
                if (response.data.access) {
                    localStorage.setItem('access_token', response.data.access);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                    return axios(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const getDashboardData = async () => {
    try {
        console.log('Fetching dashboard data from:', `${API_BASE_URL}/stocks/dashboard-data/`);
        const response = await axios.get(`${API_BASE_URL}/stocks/dashboard-data/`);
        console.log('Dashboard data response:', response.data);
        
        // If sector_performance is nested in sectors, extract it
        if (response.data && response.data.sector_performance && 
            response.data.sector_performance.sectors) {
            response.data.sector_performance = response.data.sector_performance.sectors;
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
};

export const searchStocks = async (query) => {
    try {
        const response = await axios.get(`/stocks/search/?query=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        console.error('Error searching stocks:', error);
        throw error;
    }
};

export const getStockDetails = async (symbol) => {
    try {
        const response = await axios.get(`/stocks/${symbol}/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching stock details:', error);
        throw error;
    }
};

export const addToWatchlist = async (stockId) => {
    try {
        const response = await axios.post('/watchlist/add/', { stock_id: stockId });
        return response.data;
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        throw error;
    }
};

export const getWatchlist = async () => {
    try {
        const response = await axios.get('/watchlist/');
        return response.data;
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        throw error;
    }
}; 