# Stock Market Dashboard

A full-stack web application for tracking and visualizing stock market data from the National Stock Exchange (NSE) of India. The application features real-time market data, watchlists, portfolio management, and comprehensive market analysis tools.

## Project Structure

```
📦Stock-API
 ┣ 📂nseapi (Backend - Django)
 ┃ ┣ 📂stocks (Django App)
 ┃ ┣ 📂staticfiles
 ┃ ┗ 📂templates
 ┣ 📂stock-dashboard (Frontend - React)
```

## Frontend (stock-dashboard)

### Technologies Used
- React.js
- Axios for API calls
- Chart.js for data visualization
- CSS for styling

### Key Features
1. **Dashboard**
   - Market overview with total stocks count
   - Market status (Open/Closed)
   - Gainers and Losers count
   - Top performing stocks

2. **Stock Lists**
   - Full stock listing with pagination
   - Search functionality
   - Filtering by sectors
   - Sort by price, change percentage

3. **Watchlist**
   - Add/Remove stocks
   - Real-time price updates
   - Custom notes and target prices

4. **Portfolio Management**
   - Track investments
   - Calculate profit/loss
   - Transaction history

### Installation & Setup
```bash
cd stock-dashboard
npm install
npm start
```

The application will run on `http://localhost:3000`

## Backend (nseapi)

### Technologies Used
- Django
- Django REST Framework
- SQLite/PostgreSQL
- Python packages: requests, pandas

### Key Features
1. **Stock Data Management**
   - Real-time stock data fetching
   - Historical data storage
   - Market status monitoring

2. **API Endpoints**
   - `/api/stocks/` - List all stocks
   - `/api/stocks/dashboard-data/` - Get dashboard statistics
   - `/api/watchlist/` - Manage watchlist
   - `/api/portfolio/` - Manage portfolio

3. **Authentication**
   - JWT-based authentication
   - User session management
   - Secure API access

### Installation & Setup

1. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Install dependencies
```bash
cd nseapi
pip install -r requirements.txt
```

3. Database setup
```bash
python manage.py migrate
```

4. Create superuser
```bash
python manage.py createsuperuser
```

5. Run development server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
ALLOWED_HOSTS=localhost,127.0.0.1
```

## API Documentation

### Stock Endpoints

1. Get Dashboard Data
```
GET /api/stocks/dashboard-data/
Response: {
    "top_gainers": [...],
    "top_losers": [...],
    "most_active": [...],
    "sector_performance": [...],
    "stats": {
        "total_stocks": int,
        "gainers_count": int,
        "losers_count": int,
        "market_status": string
    }
}
```

2. Search Stocks
```
GET /api/stocks/search_stocks/?query=<symbol>
Response: [
    {
        "symbol": string,
        "name": string,
        "current_price": float,
        "change_percentage": float
    }
]
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
