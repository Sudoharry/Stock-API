from rest_framework import serializers
from .models import Stock, TopSector

class StockSerializer(serializers.ModelSerializer):
    from_52w_high = serializers.SerializerMethodField()
    sector_performance = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = '__all__'
        
    def get_from_52w_high(self, obj):
        return round(((obj.high_52w - obj.current_price) / obj.high_52w * 100), 2)

    def get_sector_performance(self, obj):
        return TopSector.objects.get(name=obj.sector).performance

class TopSectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopSector
        fields = '__all__'