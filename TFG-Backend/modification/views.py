from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from interaction.models import Interaccion, Elemento, InteraccionCompartida
from .models import (
    ModificacionTexto,
    ModificacionElemento,
    ModificacionAnotacion,
)
from .serializers import(
    ModificacionAnotacionSerializer,
    ModificacionElementoSerializer,
    ModificacionTextoSerializer,
)
from .utils import validar_interaccion_y_elemento
from django.shortcuts import get_object_or_404


class VerTodasLasModificacionesInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, interaccion_id, format=None):
        interaccion = get_object_or_404(Interaccion, id=interaccion_id)

        tiene_acceso = (
            not interaccion.privado or
            interaccion.usuarios_visualizan.filter(id=request.user.id).exists() or
            interaccion.usuarios_realizan.filter(id=request.user.id).exists() or
            InteraccionCompartida.objects.filter(interaccion=interaccion, compartido_con=request.user).exists()
        )

        if not tiene_acceso:
            return Response({"error": "No tienes acceso a esta interacción."}, status=status.HTTP_403_FORBIDDEN)

        modificaciones_texto = ModificacionTexto.objects.filter(interaccion=interaccion)
        modificaciones_anotacion = ModificacionAnotacion.objects.filter(interaccion=interaccion)
        modificaciones_elemento = ModificacionElemento.objects.filter(interaccion=interaccion)

        data = {
            "texto": ModificacionTextoSerializer(modificaciones_texto, many=True).data,
            "anotacion": ModificacionAnotacionSerializer(modificaciones_anotacion, many=True).data,
            "elemento": ModificacionElementoSerializer(modificaciones_elemento, many=True).data,
        }

        return Response(data, status=status.HTTP_200_OK)
    

class CrearModificacionTextoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = request.user
        data = request.data.copy()

        error_response, interaccion, elemento = validar_interaccion_y_elemento(data, user)
        if error_response:
            return error_response

        # Validar y guardar modificación
        serializer = ModificacionTextoSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        modificacion = serializer.save(interaccion=interaccion, elemento=elemento)

        return Response({
            "msg": "Modificación de texto creada correctamente.",
            "modificacion": ModificacionTextoSerializer(modificacion).data
        }, status=status.HTTP_201_CREATED)
    

class CrearModificacionAnotacionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = request.user
        data = request.data.copy()

        # Validar que la interacción existe
        try:
            interaccion = Interaccion.objects.get(id=data['interaccion'])
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Verificar si el usuario tiene acceso a la interacción
        tiene_acceso = (
            not interaccion.privado or
            interaccion.usuarios_visualizan.filter(id=user.id).exists() or
            interaccion.usuarios_realizan.filter(id=user.id).exists() or
            InteraccionCompartida.objects.filter(interaccion=interaccion, compartido_con=user).exists()
        )

        if not tiene_acceso:
            return Response({"error": "No tienes acceso a esta interacción."}, status=status.HTTP_403_FORBIDDEN)

        # Obtener el elemento relacionado desde la modificación de tipo texto
        try:
            modificacion_texto = ModificacionTexto.objects.get(id=data.get('modificacionTextoId'))
            elemento = modificacion_texto.elemento
        except ModificacionTexto.DoesNotExist:
            return Response({"error": "Modificación de tipo texto no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Verificar si ya existe una modificación de tipo anotación con el mismo modificacionTextoId
        existing_anotacion = ModificacionAnotacion.objects.filter(modificacionTextoId=data.get('modificacionTextoId')).first()

        if existing_anotacion:
            # Actualizar el contenido de la anotación existente
            existing_anotacion.contenido = data.get('contenido', existing_anotacion.contenido)
            existing_anotacion.save()

            return Response({
                "msg": "Modificación de anotación actualizada correctamente.",
                "modificacion": ModificacionAnotacionSerializer(existing_anotacion).data
            }, status=status.HTTP_200_OK)

        # Crear nueva anotación si no existe
        serializer = ModificacionAnotacionSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        modificacion = serializer.save(interaccion=interaccion, elemento=elemento)

        return Response({
            "msg": "Modificación de anotación creada correctamente.",
            "modificacion": ModificacionAnotacionSerializer(modificacion).data
        }, status=status.HTTP_201_CREATED)


class CrearModificacionElementoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = request.user
        data = request.data.copy()

        error_response, interaccion, elemento = validar_interaccion_y_elemento(data, user)
        if error_response:
            return error_response

        serializer = ModificacionElementoSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        modificacion = serializer.save(interaccion=interaccion, elemento=elemento)
        
        return Response({
            "msg": "Modificación de elemento creada correctamente.",
            "modificacion": ModificacionElementoSerializer(modificacion).data
        }, status=status.HTTP_201_CREATED)


class EliminarModificacionTextoView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, modificacion_id):
        try:
            modificacion = ModificacionTexto.objects.get(id=modificacion_id)
        except ModificacionTexto.DoesNotExist:
            return Response({"error": "Modificación no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Verificación adicional: ¿el usuario tiene derecho a borrar?
        if request.user not in modificacion.interaccion.usuarios_realizan.all():
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        modificacion.delete()
        return Response({"msg": "Modificación eliminada."}, status=status.HTTP_200_OK)
    
class EliminarModificacionAnotacionView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, modificacion_id):
        try:
            modificacion = ModificacionAnotacion.objects.get(id=modificacion_id)
        except ModificacionTexto.DoesNotExist:
            return Response({"error": "Modificación no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Verificación adicional: ¿el usuario tiene derecho a borrar?
        if request.user not in modificacion.interaccion.usuarios_realizan.all():
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        modificacion.delete()
        return Response({"msg": "Modificación eliminada."}, status=status.HTTP_200_OK)
    
class EliminarModificacionElementoView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, modificacion_id):
        try:
            modificacion = ModificacionElemento.objects.get(id=modificacion_id)
        except ModificacionTexto.DoesNotExist:
            return Response({"error": "Modificación no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Verificación adicional: ¿el usuario tiene derecho a borrar?
        if request.user not in modificacion.interaccion.usuarios_realizan.all():
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        modificacion.delete()
        return Response({"msg": "Modificación eliminada."}, status=status.HTTP_200_OK)