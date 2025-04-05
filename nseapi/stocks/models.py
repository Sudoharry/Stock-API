from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from decimal import Decimal

class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name='stock_user_set',
        related_query_name='stock_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name='stock_user_set',
        related_query_name='stock_user',
    )

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.username

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def get_short_name(self):
        return self.first_name or self.username

class Stock(models.Model):
    symbol = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    sector = models.CharField(max_length=100, null=True, blank=True)
    current_price = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    change_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    high_52w = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='52 Week High')
    low_52w = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='52 Week Low')
    market_cap = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    pe_ratio = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='P/E Ratio')
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol} - {self.name}"

    class Meta:
        ordering = ['symbol']

class TopSector(models.Model):
    name = models.CharField(max_length=100, unique=True)
    change_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Percentage change in sector performance"
    )
    performance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Overall sector performance metric"
    )
    stocks_count = models.IntegerField(
        default=0,
        help_text="Number of stocks in this sector"
    )
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.change_percentage:+.2f}%)"

    class Meta:
        db_table = 'stocks_topsector'
        ordering = ['-change_percentage']
        verbose_name = 'Sector Performance'
        verbose_name_plural = 'Sector Performances'

class Watchlist(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='watchlist_items')
    stock = models.ForeignKey('Stock', on_delete=models.CASCADE)
    target_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'stock')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s watchlist - {self.stock.symbol}"

class ChatMessage(models.Model):
    """Model for storing chat messages"""
    user_id = models.CharField(max_length=100)
    username = models.CharField(max_length=100)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        db_table = 'stocks_chatmessage'
        
    def __str__(self):
        return f"{self.username}: {self.message[:30]}..."

