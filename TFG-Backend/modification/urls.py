from django.urls import path
from .views import (
    CrearModificacionTextoView,
    VerTodasLasModificacionesInteraccionView,
    CrearModificacionAnotacionView,
    CrearModificacionElementoView,
    EliminarModificacionTextoView,
    EliminarModificacionAnotacionView,
    EliminarModificacionElementoView,

)

urlpatterns = [
    path('texto/crear/', CrearModificacionTextoView.as_view(), name='crear_modificacion_texto'),
    path('anotacion/crear/', CrearModificacionAnotacionView.as_view(), name='crear_modificacion_texto'),
    path('elemento/crear/', CrearModificacionElementoView.as_view(), name='crear_modificacion_texto'),
    path('<int:interaccion_id>/modificaciones/', VerTodasLasModificacionesInteraccionView.as_view(), name='ver_mod_texto_por_interaccion'),
    path('texto/<int:modificacion_id>/eliminar-texto/', EliminarModificacionTextoView.as_view(), name='eliminar_mod_texto'),
    path('texto/<int:modificacion_id>/eliminar-anotacion/', EliminarModificacionAnotacionView.as_view(), name='eliminar_mod_texto'),
    path('texto/<int:modificacion_id>/eliminar-elemento/', EliminarModificacionElementoView.as_view(), name='eliminar_mod_texto'),
]
