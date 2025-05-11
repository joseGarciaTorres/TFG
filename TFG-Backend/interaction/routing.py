# interaction/routing.py

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/interaccion/<int:id>/', consumers.InteractionConsumer.as_asgi()),
]
