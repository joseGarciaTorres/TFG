from django.urls import path
from .views import (
    ObtenerCrearEntidadView,
    CrearInteraccionView,
    CompartirInteraccionView,
    VerInteraccionView,
    #ModificarElementoView,
    VerModificacionesInteraccionView,
    CrearElementoView,
    SeleccionarElementoView,
    DesbloquearElementoView,
    ElementosDeInteraccionView,
    CrearModificacionTextoView,
    VerModificacionesPorEntidadInteraccionView,
    BuscarInteraccionesView,
)

urlpatterns = [
    path('entidad/', ObtenerCrearEntidadView.as_view(), name='obtener_crear_entidad'),
    path('interaccion/', CrearInteraccionView.as_view(), name='crear_interaccion'),
    path('interaccion/compartir/', CompartirInteraccionView.as_view(), name='compartir_interaccion'),
    path('interaccion/<int:interaccion_id>/', VerInteraccionView.as_view(), name='ver_interaccion'),
    path('interaccion/<int:interaccion_id>/modificaciones/', VerModificacionesInteraccionView.as_view(), name='ver_modificaciones_interaccion'),
    path('interaccion/<int:interaccion_id>/elementos/', ElementosDeInteraccionView.as_view(), name='elementos_interaccion'),
    path('interacciones/search/', BuscarInteraccionesView.as_view(), name='buscar-interacciones'),
    path('elemento/crear/', CrearElementoView.as_view(), name='crear_elemento'),
    path('elemento/seleccionar/', SeleccionarElementoView.as_view(), name='seleccionar_elemento'),
    path('elemento/desbloquear/', DesbloquearElementoView.as_view(), name='desbloquear_elemento'),
    #path('modificacion/', ModificarElementoView.as_view(), name='modificar_elemento'),
    path('modificacion/texto/', CrearModificacionTextoView.as_view(), name='crear_modificacion_texto'),
    path('entidad/<int:entidad_id>/interaccion/<int:interaccion_id>/modificaciones/', VerModificacionesPorEntidadInteraccionView.as_view(), name='ver_modificaciones_por_entidad_interaccion'),
]
