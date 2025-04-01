import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from .models import TopSector, Stock
import time

class NseService:
    def __init__(self):
        # NSE stock symbols end with .NS
        self.suffix = ".NS"
        # Get list of NSE stocks - you might want to maintain a list of NSE symbols
        self.all_stocks = self._get_nse_symbols()
    
    def _get_nse_symbols(self):
        # You can maintain a list of NSE symbols or fetch from a reliable source
        # For now, returning a sample list
        return {
            'HDFCBANK': 'HDFC Bank',
            'RELIANCE': 'Energy',
            'TCS': 'Technology',
            'INFY': 'Technology',
            'HDFC': 'Financials',
            'SBIN': 'Financials',
            'BHARTIARTL': 'Telecom',
            'ITC': 'Consumer',
            'HINDUNILVR': 'Consumer',
            'LT': 'Industrials'
        }
    
    def get_stock_data(self, symbol, retries=3):
        attempt = 0
        backoff_time = 2

        while attempt < retries:
            try:
                # Add .NS suffix for NSE stocks
                ticker = yf.Ticker(f"{symbol}{self.suffix}")
            
                # Get current data
                current_data = ticker.history(period='1d')
                if current_data.empty:
                  print(f"⚠️ Warning: No current data for {symbol}")
                  return None
            
                # Get historical data for 52-week high/low
                hist = ticker.history(period="1y")
                if hist.empty:
                    print(f"⚠️ Warning: No historical data for {symbol}")
                    return None

                # Calculate current price from the latest close
                current_price = current_data['Close'].iloc[-1]
            
                # Calculate change percentage
                prev_close = current_data['Close'].iloc[-2] if len(current_data) > 1 else hist['Close'].iloc[-2]
                change_percentage = ((current_price - prev_close) / prev_close) * 100

                return {
                    'current_price': current_price,
                    'high_52w': hist['High'].max(),
                    'low_52w': hist['Low'].min(),
                    'market_cap': ticker.info.get('marketCap', 0),
                    'pe_ratio': ticker.info.get('trailingPE', 0),
                    'sector': ticker.info.get('sector', 'Unknown'),
                    'change_percentage': change_percentage,
                    'name': ticker.info.get('longName', symbol)
                }

            except Exception as e:
                print(f"🚨 Error fetching data for {symbol}: {e}")
                time.sleep(backoff_time)
                attempt += 1
                backoff_time *= 2

        return None

    def get_top_sectors(self, threshold=0.3):
        sectors = {}
        for symbol in self.all_stocks:
            data = self.get_stock_data(symbol)
            if not data:
                continue
                
            sector = data['sector']
            if sector not in sectors:
                sectors[sector] = {
                    'stocks': [],
                    'performance': 0
                }
            
            sectors[sector]['stocks'].append(symbol)
            sectors[sector]['performance'] += data['change_percentage']

        # Calculate average performance for each sector
        for sector in sectors:
            if sectors[sector]['stocks']:
                sectors[sector]['performance'] /= len(sectors[sector]['stocks'])

        # Return top 5 sectors by performance
        return sorted(
            sectors.items(), 
            key=lambda x: x[1]['performance'], 
            reverse=True
        )[:5]

    def update_stock_data(self):
        print("Fetching Top Sectors...")
        top_sectors = self.get_top_sectors()
        print(f"Top Sectors: {top_sectors}")

        for sector, data in top_sectors:
            print(f"Updating sector: {sector} with {len(data['stocks'])} stocks")
            
            sector_obj, _ = TopSector.objects.update_or_create(
                name=sector,
                defaults={
                    'stocks_count': len(data['stocks']),
                    'performance': data['performance']
                }
            )
            
            for symbol in data['stocks']:
                time.sleep(1)  # Rate limiting
                stock_data = self.get_stock_data(symbol)
                
                if not stock_data:
                    continue

                print(f"✅ Saving data for {symbol}")
                
                Stock.objects.update_or_create(
                    symbol=symbol,
                    defaults={
                        'name': self.all_stocks.get(symbol, "Unknown"),
                        'sector': sector,
                        'current_price': stock_data['current_price'],
                        'high_52w': stock_data['high_52w'],
                        'low_52w': stock_data['low_52w'],
                        'pe_ratio': stock_data['pe_ratio'],
                        'market_cap': stock_data['market_cap'],
                        'change_percentage': stock_data['change_percentage']
                    }
                )

        print("Stock data update complete!")

    def test_stock_data(self, symbol):
        """Test function to fetch and print stock data"""
        print(f"Fetching data for {symbol}...")
        data = self.get_stock_data(symbol)
        if data:
            print(f"Symbol: {symbol}")
            print(f"Current Price: ₹{data['current_price']:.2f}")
            print(f"Change: {data['change_percentage']:.2f}%")
            print(f"52W High: ₹{data['high_52w']:.2f}")
            print(f"52W Low: ₹{data['low_52w']:.2f}")
            print(f"Sector: {data['sector']}")
        else:
            print(f"Failed to fetch data for {symbol}")    