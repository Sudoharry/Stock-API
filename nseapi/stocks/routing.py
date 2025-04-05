from django.urls import re_path
from . import consumers

# Define WebSocket URL patterns
websocket_urlpatterns = [
    # Primary chat path
    re_path(r'ws/chat/?$', consumers.ChatConsumer.as_asgi()),
    # Root WebSocket path as fallback
    re_path(r'ws/?$', consumers.ChatConsumer.as_asgi()),
    # Direct path without the ws/ prefix for simpler connections
    re_path(r'chat/?$', consumers.ChatConsumer.as_asgi()),
] 