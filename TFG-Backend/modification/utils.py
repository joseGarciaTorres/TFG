# utils.py
from interaction.models import Interaccion, Elemento
from rest_framework.response import Response
from rest_framework import status

def validar_interaccion_y_elemento(data, user):
    try:
        interaccion = Interaccion.objects.get(id=data['interaccion'])
    except Interaccion.DoesNotExist:
        return Response({"error": "Interacción no encontrada"}, status=status.HTTP_404_NOT_FOUND), None, None

    if not interaccion.usuarios_realizan.filter(id=user.id).exists():
        return Response({"error": "No tienes permisos para modificar esta interacción"}, status=status.HTTP_403_FORBIDDEN), None, None

    try:
        elemento = Elemento.objects.get(id=data['elemento'])
    except Elemento.DoesNotExist:
        return Response({"error": "Elemento no encontrado"}, status=status.HTTP_404_NOT_FOUND), None, None

    return None, interaccion, elemento
