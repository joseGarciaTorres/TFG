from rest_framework import status
from rest_framework.generics import ListCreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Comentario, Foro
from interaction.models import Interaccion
from .serializers import ComentarioSerializer
from rest_framework.pagination import PageNumberPagination

class ComentarioPagination(PageNumberPagination):
    page_size = 50  # Mostrar solo los 50 comentarios más recientes
    page_size_query_param = 'page_size'
    max_page_size = 50

class ComentarioListView(ListCreateAPIView):
    serializer_class = ComentarioSerializer
    pagination_class = ComentarioPagination

    def get_queryset(self):
        # Obtenemos la interacción desde la URL
        interaccion_id = self.kwargs['interaccion_id']
        
        # Encontramos el foro relacionado con esa interacción
        interaccion = Interaccion.objects.get(id=interaccion_id)
        foro = interaccion.foro  # Esto obtendrá el foro si existe

        # Si no existe el foro, lo creamos (opcional según el flujo de negocio)
        if not foro:
            foro = Foro.objects.create(interaccion=interaccion)
        
        return Comentario.objects.filter(foro=foro).order_by('fecha')

    def post(self, request, *args, **kwargs):
        # Obtener la interacción desde la URL
        interaccion_id = self.kwargs['interaccion_id']
        
        # Encontramos la interacción
        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"detail": "La interacción no existe."}, status=status.HTTP_404_NOT_FOUND)

        # Verificamos si la interacción tiene un foro. Si no, lo creamos.
        foro = interaccion.foro
        if not foro:
            foro = Foro.objects.create(interaccion=interaccion)

        # Verificamos que el usuario esté autorizado para comentar (debe estar en usuarios_realizan o usuarios_visualizan)
        if request.user not in interaccion.usuarios_realizan.all() and request.user not in interaccion.usuarios_visualizan.all():
            return Response({"detail": "No tienes permiso para comentar en esta interacción."}, status=status.HTTP_403_FORBIDDEN)

        # Creamos el comentario y lo asociamos al foro y al usuario
        serializer = ComentarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(usuario=request.user, foro=foro)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

