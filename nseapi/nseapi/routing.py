from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import stocks.routing

# The top-level application that connects to all the ASGI-compatible protocols
application = ProtocolTypeRouter({
    # HTTP requests are handled by Django's default ASGI application
    "http": get_asgi_application(),
    
    # WebSocket requests are routed to the appropriate consumer based on the URL pattern
    "websocket": AuthMiddlewareStack(
        URLRouter(
            stocks.routing.websocket_urlpatterns
        )
    ),
}) 