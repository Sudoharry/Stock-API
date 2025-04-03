from rest_framework import serializers
from .models import Stock, TopSector, User
from decimal import Decimal

class StockSerializer(serializers.ModelSerializer):
    """Serializer for Stock model with safe decimal handling."""
    
    class Meta:
        model = Stock
        fields = ['id', 'symbol', 'name', 'sector', 'current_price', 'change_percentage', 'market_cap']

    def to_representation(self, instance):
        """Convert Decimal fields to float to avoid serialization issues."""
        ret = super().to_representation(instance)
        # Convert Decimal fields to float
        decimal_fields = ['current_price', 'change_percentage', 'market_cap']
        for field in ret:
            if field in decimal_fields and ret[field] is not None:
                try:
                    ret[field] = float(ret[field])
                except (TypeError, ValueError, decimal.InvalidOperation):
                    ret[field] = None
        return ret

class TopSectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopSector
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'address', 'bio', 'profile_picture']
        read_only_fields = ['id', 'username', 'email']