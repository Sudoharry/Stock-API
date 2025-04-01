from django.core.management.base import BaseCommand
from stocks.services import NseService  # Ensure this is the correct import path

class Command(BaseCommand):
    help = 'Update NSE stock data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting NSE Data Update...")  # Debugging print
        try:
            service = NseService()
            service.update_stock_data()
            self.stdout.write(self.style.SUCCESS("Successfully updated NSE data"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error updating NSE data: {e}"))