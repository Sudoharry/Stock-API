from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'stocks', views.StockViewSet)
router.register(r'sectors', views.TopSectorViewSet)

urlpatterns = [
    path('stocks/', views.stock_dashboard, name='stock_dashboard'),
    # path('update-data/', views.NseUpdateView.as_view()),
    # path('filtered-stocks/', views.StockViewSet.as_view({'get': 'filtered_stocks'})),
] + router.urls