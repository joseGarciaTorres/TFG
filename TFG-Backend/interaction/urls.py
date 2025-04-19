from django.urls import path
from .views import (
    ObtenerCrearEntidadView,
    CrearInteraccionView,
    CompartirInteraccionView,
    VerInteraccionView,
    CrearElementoView,
    SeleccionarElementoView,
    DesbloquearElementoView,
    ElementosDeInteraccionView,
    BuscarInteraccionesView,
    EliminarComparticionView,
    UnirseInteraccionPublicaView,
    EliminarUsuariosDeInteraccionView,
    InteraccionesPorUsuarioView,
)

urlpatterns = [
    path('entidad/', ObtenerCrearEntidadView.as_view(), name='obtener_crear_entidad'),
    path('crear/', CrearInteraccionView.as_view(), name='crear_interaccion'),
    path('compartir/', CompartirInteraccionView.as_view(), name='compartir_interaccion'),
    path('unirse/', UnirseInteraccionPublicaView.as_view(), name='unirse_interaccion'),
    path('<int:interaccion_id>/', VerInteraccionView.as_view(), name='ver_interaccion'),
    path('<int:interaccion_id>/elementos/', ElementosDeInteraccionView.as_view(), name='elementos_interaccion'),
    path('<int:interaccion_id>/eliminar-comparticion/<int:compartido_con_id>/', EliminarComparticionView.as_view()),
    path('<int:interaccion_id>/eliminar-usuarios/', EliminarUsuariosDeInteraccionView.as_view()),
    path('search/', BuscarInteraccionesView.as_view(), name='buscar-interacciones'),
    path('usuario/<int:usuario_id>/', InteraccionesPorUsuarioView.as_view(), name='interacciones-por-usuario'),
    path('elemento/crear/', CrearElementoView.as_view(), name='crear_elemento'),
    path('elemento/seleccionar/', SeleccionarElementoView.as_view(), name='seleccionar_elemento'),
    path('elemento/desbloquear/', DesbloquearElementoView.as_view(), name='desbloquear_elemento'),
]
