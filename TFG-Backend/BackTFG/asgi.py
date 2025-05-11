# BackTFG/asgi.py

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BackTFG.settings')
django.setup()

import interaction.routing  # <-- esta línea va aquí, después de django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Django se encarga de HTTP
    "websocket": AuthMiddlewareStack(
        URLRouter(
            interaction.routing.websocket_urlpatterns  # tus websockets
        )
    ),
})
