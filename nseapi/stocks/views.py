"""Views for the stocks application.

This module contains views for handling stock-related operations including:
- Dashboard views for market overview
- API endpoints for stock data
- Sector performance calculations
- Market status checks
"""

import logging
import random
from datetime import timedelta, time
import pytz
from django.shortcuts import render
from django.utils import timezone
from django.views import View
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse
from django.db import models
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
import decimal
from rest_framework.permissions import IsAuthenticated

from .models import Stock, TopSector, Watchlist, ChatMessage
from .serializers import StockSerializer, TopSectorSerializer, ChatMessageSerializer
from .services import NseService


logger = logging.getLogger(__name__)


def is_market_open() -> bool:
    """Check if the Indian stock market is currently open.

    Uses IST (Indian Standard Time) to determine if the market is open based on:
    - Trading hours (9:15 AM to 3:30 PM IST)
    - Trading days (Monday to Friday)

    Returns:
        bool: True if market is open, False otherwise
    """
    ist = pytz.timezone('Asia/Kolkata')
    current_time = timezone.now().astimezone(ist)
    
    market_start = time(9, 15)
    market_end = time(15, 30)
    is_weekday = current_time.weekday() < 5
    is_market_hours = market_start <= current_time.time() <= market_end
    
    return is_weekday and is_market_hours


def stock_dashboard(request):
    """Render the main stock dashboard page.

    Aggregates various market data including:
    - Top performing stocks
    - Market status
    - Recent stock updates
    - Top performing sectors
    - Market statistics (gainers/losers)

    Args:
        request: The HTTP request object

    Returns:
        HttpResponse: Rendered dashboard template with market data context
    """
    top_stocks = Stock.objects.all().order_by('-change_percentage')[:20]
    market_status = "Open" if is_market_open() else "Closed"
    
    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    recent_stocks = Stock.objects.filter(last_updated__gte=last_24h).order_by('-last_updated')[:10]
    top_sectors = TopSector.objects.all().order_by('-performance')[:3]
    
    context = {
        'total_stocks': Stock.objects.count(),
        'top_stocks': top_stocks,
        'top_sectors': top_sectors,
        'market_status': market_status,
        'recent_stocks': recent_stocks,
        'gainer_count': Stock.objects.filter(change_percentage__gt=0).count(),
        'loser_count': Stock.objects.filter(change_percentage__lt=0).count(),
    }
    return render(request, 'stocks/dashboard.html', context)


class StockViewSet(viewsets.ModelViewSet):
    """ViewSet for managing stock-related operations.

    Provides CRUD operations for stocks and additional actions for:
    - Top performers
    - Sector performance
    - Filtered stock lists
    """

    queryset = Stock.objects.all()
    serializer_class = StockSerializer

    def get_queryset(self):
        """Get alphabetically sorted stocks.

        Returns:
            QuerySet: Stocks ordered by symbol
        """
        return Stock.objects.all().order_by('symbol')

    @action(detail=False, methods=['get'])
    def search_stocks(self, request):
        """Search stocks by symbol or name."""
        query = request.query_params.get('query', '').strip().upper()
        logger.info(f"Searching stocks with query: {query}")
        
        if not query:
            return Response([])
            
        try:
            # First try exact match on symbol
            exact_matches = Stock.objects.filter(symbol__iexact=query)
            
            # Then try partial matches for both symbol and name
            partial_matches = Stock.objects.filter(
                Q(symbol__icontains=query) |
                Q(name__icontains=query)
            ).exclude(
                id__in=exact_matches.values('id')
            ).order_by('symbol')[:50]  # Increased limit to 50
            
            # Combine exact and partial matches
            all_matches = list(exact_matches) + list(partial_matches)
            
            serializer = self.get_serializer(all_matches, many=True)
            logger.info(f"Found {len(all_matches)} matches for query: {query}")
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error searching stocks: {str(e)}")
            return Response(
                {"error": "An error occurred while searching stocks"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def top_performers(self, request):
        """Retrieve top performing stocks.

        Returns:
            Response: Serialized data of top 20 stocks by change percentage
        """
        top_stocks = Stock.objects.all().order_by('-change_percentage')[:20]
        serializer = self.get_serializer(top_stocks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sectors(self, request):
        """Calculate and retrieve sector performance data.

        Filters out invalid sectors and calculates weighted performance
        based on market capitalization.

        Returns:
            Response: Top 10 sectors with performance metrics
                     or error response if calculation fails

        Raises:
            HTTP 500: If sector calculation fails
        """
        try:
            stocks = Stock.objects.filter(
                sector__isnull=False,
                change_percentage__isnull=False,
                current_price__gt=0
            ).exclude(
                sector__in=['', 'Unknown', 'unknown']
            ).select_related()
            
            top_sectors = calculate_sector_performance(stocks)[:10]
            
            for sector_data in top_sectors:
                TopSector.objects.update_or_create(
                    name=sector_data['name'],
                    defaults={
                        'change_percentage': sector_data['performance'],
                        'performance': sector_data['performance'],
                        'stocks_count': sector_data['stocks_count']
                    }
                )
            
            return Response({
                'sectors': top_sectors,
                'total_sectors': len(top_sectors)
            })
            
        except Exception as e:
            logger.error(f"Error calculating sector performance: {str(e)}")
            return Response(
                {"error": "Failed to calculate sector performance"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def all_stocks_az(self, request):
        """Get all stocks sorted alphabetically by symbol."""
        stocks = Stock.objects.all().order_by('symbol')
        serializer = self.get_serializer(stocks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def filtered_stocks(self, request):
        """Retrieve stocks filtered by threshold and sector."""
        try:
            threshold = float(request.query_params.get('threshold', 0.3))
        except ValueError:
            return Response({"error": "Invalid threshold value"}, status=status.HTTP_400_BAD_REQUEST)

        sectors = request.query_params.get('sectors', '')
        queryset = Stock.objects.all()
        
        if sectors:
            sector_list = sectors.split(',')
            queryset = queryset.filter(sector__in=sector_list)
        
        # First filter by sector, then sort by symbol
        queryset = queryset.order_by('symbol')
        
        filtered_stocks = [
            stock for stock in queryset
            if stock.current_price >= stock.high_52w * (1 - threshold)
        ]
        
        serializer = self.get_serializer(filtered_stocks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='dashboard-data')
    def dashboard_data(self, request):
        """Get aggregated data for the dashboard.
        
        Returns:
            Response: Dashboard data including:
                - Top gainers
                - Top losers
                - Most active stocks
                - Sector performance
                - Market statistics
        """
        try:
            logger.info("Fetching dashboard data")
            
            # Get top gainers (stocks with highest positive change)
            top_gainers = Stock.objects.filter(
                change_percentage__gt=0
            ).order_by('-change_percentage')[:5]
            logger.info(f"Found {top_gainers.count()} top gainers")

            # Get top losers (stocks with lowest negative change)
            top_losers = Stock.objects.filter(
                change_percentage__lt=0
            ).order_by('change_percentage')[:5]
            logger.info(f"Found {top_losers.count()} top losers")

            # Get most active stocks (by market cap)
            most_active = Stock.objects.exclude(
                market_cap__isnull=True
            ).order_by('-market_cap')[:5]
            logger.info(f"Found {most_active.count()} most active stocks")

            # Get sector performance
            sectors = TopSector.objects.all().order_by('-change_percentage')[:5]
            logger.info(f"Found {sectors.count()} sector performances")

            # Calculate market statistics
            total_stocks = Stock.objects.count()
            gainers_count = Stock.objects.filter(change_percentage__gt=0).count()
            losers_count = Stock.objects.filter(change_percentage__lt=0).count()

            response_data = {
                'top_gainers': StockSerializer(top_gainers, many=True).data,
                'top_losers': StockSerializer(top_losers, many=True).data,
                'most_active': StockSerializer(most_active, many=True).data,
                'sector_performance': TopSectorSerializer(sectors, many=True).data,
                'stats': {
                    'total_stocks': total_stocks,
                    'gainers_count': gainers_count,
                    'losers_count': losers_count,
                    'market_status': 'Open' if is_market_open() else 'Closed'
                }
            }

            logger.info("Successfully compiled dashboard data")
            return Response(response_data)

        except Exception as e:
            logger.error(f"Error fetching dashboard data: {str(e)}")
            return Response(
                {"error": "Failed to fetch dashboard data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TopSectorViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving top performing sectors.

    Provides read-only access to sector performance data with automatic
    creation of 'Other' sector if no sectors exist.

    Attributes:
        queryset: All TopSector objects
        serializer_class: TopSectorSerializer for data serialization
    """

    queryset = TopSector.objects.all()
    serializer_class = TopSectorSerializer

    def get_queryset(self):
        """Get all sectors, ensuring 'Other' sector exists.

        Creates an 'Other' sector with default values if no sectors exist
        in the database.

        Returns:
            QuerySet: All TopSector objects
        """
        if not TopSector.objects.exists():
            TopSector.objects.get_or_create(
                name="Other",
                defaults={"performance": 0.0, "stocks_count": 0}
            )
        return TopSector.objects.all()

class NseUpdateView(APIView):
    """API View for updating stock data from NSE.

    Provides an endpoint to trigger manual updates of stock data
    from the National Stock Exchange.
    """

    def post(self, request):
        """Handle POST request to update stock data.

        Triggers the NSE service to fetch and update stock data
        in the database.

        Args:
            request: HTTP request object

        Returns:
            Response: Success message or error details

        Raises:
            HTTP 500: If update process fails
        """
        try:
            service = NseService()
            service.update_stock_data()
            return Response(
                {"status": "Data updated successfully"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"NSE Update failed: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StockDataView(View):
    """Django View for rendering stock data on the dashboard."""
    def get(self, request):
        nse_symbols = self._get_nse_symbols()
        stock_data = [
            {
                'symbol': symbol,
                'name': details['name'],
                'sector': details['sector'],
                'price': self._get_current_price(symbol),
                'change': self._get_price_change(symbol)
            }
            for symbol, details in nse_symbols.items()
        ]
        
        context = {
            'all_stocks': stock_data,
            'sectors': self._get_unique_sectors(nse_symbols),
        }
        return render(request, 'stocks/dashboard.html', context)

    def _get_nse_symbols(self):
        """Retrieve hardcoded NSE symbols for demonstration purposes."""
        return {
            "RELIANCE": {"name": "Reliance Industries", "sector": "Energy"},
            "TCS": {"name": "Tata Consultancy Services", "sector": "IT"}
        }

    def _get_current_price(self, symbol):
        """Simulate fetching the current stock price."""
        return 2500.00  

    def _get_price_change(self, symbol):
        """Simulate fetching the stock price change."""
        return 2.5

    def _get_unique_sectors(self, symbols):
        """Extract unique sectors from stock data."""
        return sorted({v['sector'] for v in symbols.values()})

class DashboardDataAPI(APIView):
    """API View to retrieve dashboard stock statistics."""
    def get(self, request):
        market_status = "Open" if is_market_open() else "Closed"
        gainers_count = Stock.objects.filter(change_percentage__gt=0).count()
        losers_count = Stock.objects.filter(change_percentage__lt=0).count()

        data = {
            "total_stocks": Stock.objects.count(),
            "market_status": market_status,
            "gainers_count": gainers_count,
            "losers_count": losers_count,
        }
        return Response(data)

def stock_list(request):
    try:
        stocks = list(Stock.objects.values(
            'symbol', 'name', 'sector', 'current_price', 'change_percentage'
        ))
        return JsonResponse(stocks, safe=False)
    except Exception as e:
        logger.error(f"Error in stock_list view: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)

def dashboard_data(request):
    try:
        total_stocks = Stock.objects.count()
        gainers = Stock.objects.filter(change_percentage__gt=0)
        losers = Stock.objects.filter(change_percentage__lt=0)
        
        data = {
            'totalStocks': total_stocks,
            'marketStatus': 'Open' if is_market_open() else 'Closed',  # Use is_market_open() function
            'gainersCount': gainers.count(),
            'losersCount': losers.count()
        }
        return JsonResponse(data)
    except Exception as e:
        logger.error(f"Error in dashboard_data view: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)

def top_performers(request):
    try:
        # Get top 10 stocks with positive change percentage
        top_stocks = list(Stock.objects.filter(
            change_percentage__gt=0
        ).order_by('-change_percentage')[:10].values(
            'symbol', 'name', 'current_price', 'change_percentage'
        ))
        
        # Format the data
        formatted_stocks = [{
            'symbol': stock['symbol'],
            'name': stock['name'],
            'current_price': float(stock['current_price']),
            'change_percentage': float(stock['change_percentage'])
        } for stock in top_stocks]
        
        return JsonResponse(formatted_stocks, safe=False)
    except Exception as e:
        logger.error(f"Error in top_performers view: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)

def calculate_sector_performance(stocks_queryset):
    """Calculate weighted performance metrics for each sector.

    Processes stock data to calculate sector-wise performance using
    market capitalization as weights. Includes top performing stocks
    within each sector.

    Args:
        stocks_queryset (QuerySet): Filtered queryset of Stock objects

    Returns:
        list: Sorted list of sector dictionaries containing:
            - name (str): Sector name
            - performance (float): Weighted average performance
            - stocks_count (int): Number of stocks in sector
            - top_stocks (list): Top 5 performing stocks in sector

    Notes:
        - Excludes sectors with less than 2 stocks
        - Uses market cap as weight, falls back to price * 1M if unavailable
        - Sorts sectors by absolute performance value
    """
    sectors_data = {}
    
    for stock in stocks_queryset:
        sector = stock.sector.strip()
        if not sector or sector.lower() == 'unknown':
            continue
            
        if sector not in sectors_data:
            sectors_data[sector] = {
                'total_weighted_change': 0,
                'total_weight': 0,
                'count': 0,
                'stocks': []
            }
        
        weight = float(stock.market_cap if stock.market_cap else (stock.current_price * 1000000))
        
        sectors_data[sector]['total_weighted_change'] += float(stock.change_percentage) * weight
        sectors_data[sector]['total_weight'] += weight
        sectors_data[sector]['count'] += 1
        sectors_data[sector]['stocks'].append({
            'symbol': stock.symbol,
            'name': stock.name,
            'change_percentage': float(stock.change_percentage)
        })
    
    sectors_list = []
    for sector, data in sectors_data.items():
        if data['count'] >= 2:
            avg_performance = data['total_weighted_change'] / data['total_weight']
            sectors_list.append({
                'name': sector,
                'performance': round(avg_performance, 2),
                'stocks_count': data['count'],
                'top_stocks': sorted(data['stocks'], 
                                  key=lambda x: abs(x['change_percentage']), 
                                  reverse=True)[:5]
            })
    
    return sorted(sectors_list, key=lambda x: abs(x['performance']), reverse=True)

def sectors(request):
    """Retrieve top performing sectors.

    A standalone view that uses the same sector calculation logic
    as the ViewSet but returns only top 5 sectors.

    Args:
        request: HTTP request object

    Returns:
        JsonResponse: Top 5 sectors data or error response

    Raises:
        HTTP 500: If sector calculation fails
    """
    try:
        stocks = Stock.objects.filter(
            sector__isnull=False,
            change_percentage__isnull=False,
            current_price__gt=0
        ).exclude(
            sector__in=['', 'Unknown', 'unknown']
        ).select_related()
        
        top_sectors = calculate_sector_performance(stocks)[:5]
        
        return JsonResponse(top_sectors, safe=False)
    except Exception as e:
        logger.error(f"Error in sectors view: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_watchlist(request):
    """Get the user's watchlist items."""
    try:
        watchlist_items = Watchlist.objects.filter(user=request.user)
        data = [{
            'id': item.id,
            'symbol': item.stock.symbol,
            'name': item.stock.name,
            'current_price': item.stock.current_price,
            'change_percentage': item.stock.change_percentage,
            'target_price': item.target_price,
            'notes': item.notes
        } for item in watchlist_items]
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_watchlist(request):
    """Add a stock to the user's watchlist."""
    try:
        symbol = request.data.get('symbol')
        if not symbol:
            return Response({'error': 'Symbol is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create the stock
        try:
            stock = Stock.objects.get(symbol=symbol)
        except Stock.DoesNotExist:
            return Response({'error': 'Stock not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if stock is already in watchlist
        if Watchlist.objects.filter(user=request.user, stock=stock).exists():
            return Response({'error': 'Stock already in watchlist'}, status=status.HTTP_400_BAD_REQUEST)

        # Create watchlist item
        watchlist_item = Watchlist.objects.create(
            user=request.user,
            stock=stock,
            target_price=request.data.get('target_price', None),
            notes=request.data.get('notes', '')
        )

        data = {
            'id': watchlist_item.id,
            'symbol': stock.symbol,
            'name': stock.name,
            'current_price': stock.current_price,
            'change_percentage': stock.change_percentage,
            'target_price': watchlist_item.target_price,
            'notes': watchlist_item.notes
        }
        return Response(data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_watchlist(request, item_id):
    """Remove a stock from the user's watchlist."""
    try:
        watchlist_item = Watchlist.objects.get(id=item_id, user=request.user)
        watchlist_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Watchlist.DoesNotExist:
        return Response({'error': 'Watchlist item not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_heatmap_data(request):
    """
    Get stock data for the heatmap visualization
    Returns a list of stocks with price and percentage change for heatmap display
    """
    try:
        # Get all stocks with price and change data
        stocks = Stock.objects.all()
        
        # Transform to dict for heatmap
        heatmap_data = []
        for stock in stocks:
            # Use actual change_percentage if available, otherwise generate random
            percent_change = stock.change_percentage if stock.change_percentage is not None else round(random.uniform(-8.0, 8.0), 2)
            
            heatmap_data.append({
                'symbol': stock.symbol,
                'name': stock.name,
                'sector': stock.sector,
                'price': float(stock.current_price) if hasattr(stock, 'current_price') and stock.current_price else 0.0,
                'percent_change': float(percent_change),
            })
        
        # Sort by sector and then by percentage change
        heatmap_data.sort(key=lambda x: (x['sector'] or 'Unknown', -x['percent_change']))
        
        return Response(heatmap_data)
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_chat_messages(request):
    """
    Retrieve the most recent chat messages.
    """
    try:
        # Get the latest 100 messages in reverse chronological order
        messages = ChatMessage.objects.order_by('-timestamp')[:100]
        
        # Reverse the list to display oldest messages first
        messages = list(reversed(messages))
        
        serializer = ChatMessageSerializer(messages, many=True)
        logger.info(f"Retrieved {len(messages)} chat messages")
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error retrieving chat messages: {str(e)}")
        return Response(
            {"error": "Failed to retrieve chat messages"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat_message(request):
    """
    Create a new chat message.
    """
    try:
        data = {
            'user_id': str(request.user.id),
            'username': request.user.username,
            'message': request.data.get('message')
        }
        
        if not data['message']:
            logger.warning(f"Attempt to create empty message by {request.user.username}")
            return Response(
                {"error": "Message content is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer = ChatMessageSerializer(data=data)
        if serializer.is_valid():
            chat_message = serializer.save()
            logger.info(f"Chat message created by {request.user.username}: {data['message'][:30]}...")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Invalid chat message data: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error creating chat message: {str(e)}")
        return Response(
            {"error": "Failed to create chat message"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Template view for chat
def chat_view(request):
    """
    Render the chat template.
    """
    return render(request, 'stocks/chat.html')