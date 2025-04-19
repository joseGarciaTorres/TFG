from django.urls import path
from .views import ComentarioListView

urlpatterns = [
    path('<int:interaccion_id>/comentarios/', ComentarioListView.as_view(), name='comentarios-list'),
    #path('<int:interaccion_id>/comentarios/create/', ComentarioView.as_view(), name='comentarios-create'),
]
