from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from rest_framework_simplejwt.views import TokenRefreshView

# Create a router for stock endpoints
router = DefaultRouter()
router.register(r'stocks', views.StockViewSet, basename='stock')
router.register(r'sectors', views.TopSectorViewSet)

# Stock viewset URLs
stock_urls = [
    path('search/', views.StockViewSet.as_view({'get': 'search_stocks'}), name='stock-search'),
]

# Define URL patterns
urlpatterns = [
    path('api/', include([
        # Stock endpoints
        path('stocks/', include(stock_urls)),
        
        # Authentication endpoints
        path('auth/register/', auth_views.register_user, name='register'),
        path('auth/login/', auth_views.login_user, name='login'),
        path('auth/logout/', auth_views.logout_user, name='logout'),
        path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('auth/profile/', auth_views.profile, name='profile'),
        
        # Include router URLs
        path('', include(router.urls)),
    ])),
]