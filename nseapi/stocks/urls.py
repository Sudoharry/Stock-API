from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from rest_framework_simplejwt.views import TokenRefreshView

# Create a router for stock endpoints
router = DefaultRouter()
router.register(r'stocks', views.StockViewSet, basename='stock')
router.register(r'sectors', views.TopSectorViewSet)

# Authentication URLs
auth_urls = [
    path('auth/register/', auth_views.register_user, name='register'),
    path('auth/login/', auth_views.login_user, name='login'),
    path('auth/logout/', auth_views.logout_user, name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', auth_views.profile, name='profile'),
]

# Stock-specific URLs
stock_urls = [
    path('stocks/dashboard-data/', views.StockViewSet.as_view({'get': 'dashboard_data'}), name='dashboard-data'),
    path('stocks/heatmap/', views.get_heatmap_data, name='stock_heatmap'),
]

# Watchlist URLs
watchlist_urls = [
    path('watchlist/', views.get_watchlist, name='watchlist'),
    path('watchlist/add/', views.add_to_watchlist, name='add-to-watchlist'),
    path('watchlist/<int:item_id>/', views.remove_from_watchlist, name='remove-from-watchlist'),
]

# Chat endpoints
chat_urls = [
    path('chat/messages/', views.get_chat_messages, name='get_chat_messages'),
    path('chat/messages/create/', views.create_chat_message, name='create_chat_message'),
]

# Main URL patterns
urlpatterns = auth_urls + stock_urls + watchlist_urls + chat_urls + [
    path('', include(router.urls)),
    path('chat/', views.chat_view, name='chat_view'),
]