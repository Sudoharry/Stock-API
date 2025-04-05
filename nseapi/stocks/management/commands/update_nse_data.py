from django.core.management.base import BaseCommand
from stocks.models import Stock, TopSector
import requests
import csv
import yfinance as yf
from io import StringIO
from django.utils import timezone
from datetime import timedelta
import logging
from django.db import models
from concurrent.futures import ThreadPoolExecutor, as_completed
from tenacity import retry, wait_exponential, stop_after_attempt
import time
from time import sleep

# Logger setup
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Updates stock data from NSE and Yahoo Finance'
    
    # Sector mapping configuration
    SECTOR_MAPPING = {
        'BANK': 'Financial Services',
        'FINANCE': 'Financial Services',
        'INSURANCE': 'Financial Services',
        'TECH': 'Information Technology',
        'SOFTWARE': 'Information Technology',
        'OIL': 'Energy',
        'PETRO': 'Energy',
        'PHARMA': 'Healthcare',
        'DRUGS': 'Healthcare',
        'STEEL': 'Manufacturing',
        'POWER': 'Utilities',
        'ELECTRIC': 'Utilities'
    }

    def handle(self, *args, **options):
        try:
            # Step 1: Update stock listings from NSE
            self.stdout.write("Updating NSE listings...")
            nse_stocks = self.fetch_nse_listings()
            
            # Step 2: Update database with basic stock info
            updated_stocks = self.update_stock_listings(nse_stocks)
            
            # Step 3: Fetch detailed financial data concurrently
            self.stdout.write("Updating market data...")
            self.update_financial_data(updated_stocks)
            
            # Step 4: Update sector performance
            self.stdout.write("Calculating sector performance...")
            self.update_sector_performance()
            
            self.stdout.write(self.style.SUCCESS("Stock update completed successfully"))

        except Exception as e:
            logger.error(f"Stock update failed: {str(e)}")
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))

    def fetch_nse_listings(self):
        """Fetch current NSE listings from official source"""
        url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return self.parse_nse_csv(response.text)

    def parse_nse_csv(self, csv_content):
        """Parse NSE CSV data with sector detection"""
        reader = csv.DictReader(StringIO(csv_content))
        stocks = {}
        
        for row in reader:
            if row[' SERIES'] != 'EQ':  # Only process equity shares
                continue
                
            symbol = row['SYMBOL']
            stocks[symbol] = {
                'name': row['NAME OF COMPANY'].title(),
                'sector': self.detect_sector(row['NAME OF COMPANY']),
                'listed_date': row[' DATE OF LISTING'],
                'isin': row[' ISIN NUMBER']
            }
        return stocks

    def detect_sector(self, company_name):
        """Determine sector based on company name"""
        company_name = company_name.upper()
        for keyword, sector in self.SECTOR_MAPPING.items():
            if keyword in company_name:
                return sector
        return 'Other'

    def update_stock_listings(self, nse_stocks):
        """Update or create stock records in database with safe defaults"""
        updated_symbols = []
        stocks_to_update = []
        
        for symbol, data in nse_stocks.items():
            # Default values for required fields
            defaults = {
                'name': data['name'],
                'sector': data['sector'],
                'current_price': 0.00,
                'high_52w': 0.00,
                'low_52w': 0.00,
                'market_cap': 0.00,
                'change_percentage': 0.00
            }
            
            stock, created = Stock.objects.update_or_create(
                symbol=symbol,
                defaults=defaults
            )
            updated_symbols.append(symbol)
        
        # Bulk delete delisted stocks
        Stock.objects.exclude(symbol__in=updated_symbols).delete()
        
        return updated_symbols

    @retry(wait=wait_exponential(multiplier=1, min=4, max=10), stop=stop_after_attempt(5))
    def fetch_financial_data(self, symbol):
        """Fetch financial data for a stock symbol with retry logic"""
        try:
            ticker = yf.Ticker(f"{symbol}.NS")
            return ticker.info, ticker.history(period="1y")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                logger.error(f"401 Unauthorized: Too many requests for {symbol}. Retrying in 10 seconds.")
                sleep(10)  # Retry after 10 seconds
                return self.fetch_financial_data(symbol)  # Retry the function call
            else:
             raise
    
    

    def update_financial_data(self, symbols):
        """Fetch and update financial data concurrently"""
        update_data = []
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_symbol = {executor.submit(self.fetch_and_update_symbol, symbol): symbol for symbol in symbols}
            for future in as_completed(future_to_symbol):
                symbol = future_to_symbol[future]
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"Failed to update {symbol}: {str(e)}")
                    continue

    def fetch_and_update_symbol(self, symbol):
        """Fetch and update the stock data for a single symbol"""
        try:
            info, hist = self.fetch_financial_data(symbol)

            sleep(1)  # Adjust the sleep time based on your requirements
            
            # Safely get values with fallbacks
            current_price = info.get('currentPrice') or \
                              info.get('regularMarketPrice') or \
                              0.00
            previous_close = info.get('regularMarketPreviousClose') or current_price
            
            # Check if the stock has no price data or delisted
            if current_price == 0.00 or 'delisted' in info.get('longName', '').lower():
                logger.warning(f"{symbol}: Delisted or missing data, skipping.")
                return  # Skip this stock if no price data or it is delisted
            
            # Calculate 52-week values only if historical data is available
            if not hist.empty:
                high_52w = hist['High'].max()
                low_52w = hist['Low'].min()
            else:
                high_52w = current_price
                low_52w = current_price
            
            update_data = {
                'current_price': current_price,
                'high_52w': high_52w,
                'low_52w': low_52w,
                'market_cap': info.get('marketCap', 0.00),
                'pe_ratio': info.get('trailingPE', None),
                'change_percentage': ((current_price - previous_close) / previous_close * 100) if previous_close else 0.00,
                'last_updated': timezone.now()
            }
            
            # Remove None values to prevent null assignments
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            # Update stock data in bulk (for now, it can be collected in a list for later bulk update)
            Stock.objects.filter(symbol=symbol).update(**update_data)
        except Exception as e:
            logger.error(f"Error updating symbol {symbol}: {str(e)}")
    
    def update_sector_performance(self):
        """Calculate and update top performing sectors"""
        sectors = Stock.objects.values('sector').annotate(
            avg_performance=models.Avg('change_percentage'),
            stock_count=models.Count('symbol')
        ).order_by('-avg_performance')[:5]  # Top 5 sectors
        
        # Bulk delete old sector data
        TopSector.objects.all().delete()
        
        # Bulk create new sector entries
        sector_entries = [
            TopSector(name=sector['sector'], performance=sector['avg_performance'], stocks_count=sector['stock_count'])
            for sector in sectors
        ]
        
        TopSector.objects.bulk_create(sector_entries)