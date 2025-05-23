"""
ASGI config for nseapi project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import stocks.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nseapi.settings')
django.setup()

# This application object combines both HTTP and WebSocket handling
application = ProtocolTypeRouter({
    # Django's ASGI application for handling HTTP requests
    "http": get_asgi_application(),
    
    # WebSocket handling with authentication and routing
    "websocket": AuthMiddlewareStack(
        URLRouter(
            stocks.routing.websocket_urlpatterns
        )
    ),
})
