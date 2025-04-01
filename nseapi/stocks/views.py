from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Stock, TopSector
from django.db import models
from datetime import timedelta, time
from .serializers import StockSerializer, TopSectorSerializer
from rest_framework.decorators import action
from rest_framework.views import APIView
from .services import NseService
from django.utils import timezone
from django.utils import timezone
import pytz



def is_market_open():
    # Get current time in IST
    ist = pytz.timezone('Asia/Kolkata')
    current_time = timezone.now().astimezone(ist)
    
    # Market hours: 9:15 AM to 3:30 PM IST, Monday to Friday
    market_start = time(9, 15)  # 9:15 AM
    market_end = time(15, 30)   # 3:30 PM
    
    # Check if it's a weekday (0 = Monday, 6 = Sunday)
    is_weekday = current_time.weekday() < 5
    
    # Check if current time is within market hours
    is_market_hours = market_start <= current_time.time() <= market_end
    
    return is_weekday and is_market_hours

def stock_dashboard(request):
    # Get top performing stocks (highest price change percentage)
    top_stocks = Stock.objects.all().order_by('-change_percentage')[:5]

    # Get market status based on time
    market_status = "Open" if is_market_open() else "Closed"

    # Get recent stock updates from last 24 hours
    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    recent_stocks = Stock.objects.filter(
        last_updated__gte=last_24h
    ).order_by('-last_updated')[:10]

    # Get top performing sectors
    top_sectors = TopSector.objects.all().order_by('-performance')[:3]

    context = {
        'total_stocks': Stock.objects.count(),
        'top_stocks': top_stocks,
        'top_sectors': top_sectors,
        'market_status': market_status,
        'recent_stocks': recent_stocks,
        # Additional metrics
        'gainers_count': Stock.objects.filter(change_percentage__gt=0).count(),
        'losers_count': Stock.objects.filter(change_percentage__lt=0).count(),
    }
    return render(request, 'stocks/index.html', context)

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer

    @action(detail=False, methods=['get'])
    def filtered_stocks(self, request):
        try:
            threshold = float(request.query_params.get('threshold', 0.3))
        except ValueError:
            return Response({"error": "Invalid threshold value"}, status=status.HTTP_400_BAD_REQUEST)

        sectors = request.query_params.get('sectors', '')

        # Query optimization: Fetch only required fields
        queryset = Stock.objects.values('id', 'name', 'current_price', 'high_52w', 'sector')
        
        filtered_queryset = [
            stock for stock in queryset
            if stock["current_price"] >= stock["high_52w"] * (1 - threshold)
        ]
        
        if sectors:
            sector_list = sectors.split(',')
            filtered_queryset = [stock for stock in filtered_queryset if stock["sector"] in sector_list]

        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)
    

class TopSectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TopSector.objects.prefetch_related('stocks')  # Assuming a relation with Stock
    serializer_class = TopSectorSerializer


class NseUpdateView(APIView):
    def post(self, request):
        try:
            service = NseService()
            service.update_stock_data()
            return Response({"status": "Data updated successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


