from django.db import models

class Stock(models.Model):
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    sector = models.CharField(max_length=100)
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    high_52w = models.DecimalField(max_digits=10, decimal_places=2)
    low_52w = models.DecimalField(max_digits=10, decimal_places=2)
    market_cap = models.DecimalField(max_digits=20, decimal_places=2)
    pe_ratio = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    last_updated = models.DateTimeField(auto_now=True)
    change_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    def __str__(self):
        return f"{self.symbol} - {self.name}"

    class Meta:
        indexes = [
            models.Index(fields=['sector']),
            models.Index(fields=['high_52w']),
        ]
        ordering = ['symbol']

class TopSector(models.Model):
    name = models.CharField(max_length=50, unique=True)
    performance = models.FloatField()  # YTD performance
    stocks_count = models.IntegerField()
    last_updated = models.DateTimeField(auto_now=True)