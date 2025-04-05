from rest_framework import serializers
from .models import Stock, TopSector, User, ChatMessage
from decimal import Decimal

class StockSerializer(serializers.ModelSerializer):
    """Serializer for Stock model with safe decimal handling."""
    
    class Meta:
        model = Stock
        fields = [
            'id', 
            'symbol', 
            'name', 
            'sector',
            'current_price',
            'change_percentage',
            'high_52w',
            'low_52w',
            'market_cap',
            'pe_ratio'
        ]

    def to_representation(self, instance):
        """Convert decimal fields to float for better JSON serialization."""
        ret = super().to_representation(instance)
        decimal_fields = [
            'current_price',
            'change_percentage',
            'high_52w',
            'low_52w',
            'market_cap',
            'pe_ratio'
        ]
        
        for field in decimal_fields:
            if field in ret and ret[field] is not None:
                try:
                    ret[field] = float(ret[field])
                except (TypeError, ValueError):
                    ret[field] = None
        
        return ret

class TopSectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopSector
        fields = ['id', 'name', 'performance', 'change_percentage', 'stocks_count', 'last_updated']

    def to_representation(self, instance):
        """Convert decimal fields to float for better JSON serialization."""
        ret = super().to_representation(instance)
        decimal_fields = ['performance', 'change_percentage']
        for field in decimal_fields:
            if ret[field] is not None:
                try:
                    ret[field] = float(ret[field])
                except (TypeError, ValueError):
                    ret[field] = None
        return ret

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'address', 'bio', 'profile_picture']
        read_only_fields = ['id', 'username', 'email']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'user_id', 'username', 'message', 'timestamp']
        read_only_fields = ['id', 'timestamp']