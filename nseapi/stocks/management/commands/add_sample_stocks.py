from django.core.management.base import BaseCommand
from stocks.models import Stock

class Command(BaseCommand):
    help = 'Adds sample stock data for testing'

    def handle(self, *args, **kwargs):
        sample_stocks = [
            {
                'symbol': 'RELIANCE',
                'name': 'Reliance Industries Limited',
                'sector': 'Energy',
                'current_price': 2500.00,
                'high_52w': 2800.00,
                'low_52w': 2000.00,
                'market_cap': 1500000000000.00,
                'pe_ratio': 25.5,
                'change_percentage': 2.5
            },
            {
                'symbol': 'TCS',
                'name': 'Tata Consultancy Services',
                'sector': 'IT',
                'current_price': 3500.00,
                'high_52w': 3800.00,
                'low_52w': 3000.00,
                'market_cap': 1200000000000.00,
                'pe_ratio': 30.2,
                'change_percentage': 1.8
            },
            {
                'symbol': 'INFY',
                'name': 'Infosys Limited',
                'sector': 'IT',
                'current_price': 1500.00,
                'high_52w': 1800.00,
                'low_52w': 1200.00,
                'market_cap': 900000000000.00,
                'pe_ratio': 28.5,
                'change_percentage': -0.5
            },
            {
                'symbol': 'HDFCBANK',
                'name': 'HDFC Bank Limited',
                'sector': 'Banking',
                'current_price': 1600.00,
                'high_52w': 1700.00,
                'low_52w': 1400.00,
                'market_cap': 800000000000.00,
                'pe_ratio': 22.8,
                'change_percentage': 1.2
            },
            {
                'symbol': 'TATASTEEL',
                'name': 'Tata Steel Limited',
                'sector': 'Metal',
                'current_price': 120.00,
                'high_52w': 140.00,
                'low_52w': 90.00,
                'market_cap': 150000000000.00,
                'pe_ratio': 15.5,
                'change_percentage': -1.5
            }
        ]

        for stock_data in sample_stocks:
            Stock.objects.get_or_create(
                symbol=stock_data['symbol'],
                defaults=stock_data
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully added/updated stock {stock_data["symbol"]}')
            ) 