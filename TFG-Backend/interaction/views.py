from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Entidad, Interaccion, InteraccionCompartida, Modificacion, Elemento
from .serializers import (
    EntidadSerializer, InteraccionSerializer, InteraccionCompartidaSerializer, ModificacionSerializer, 
    ElementoSerializer, TextoSerializer, ModificacionCreateSerializer
)

# 1. Obtener o crear una entidad desde su URL
class ObtenerCrearEntidadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        url = request.data.get('url')
        if not url:
            return Response({"error": "URL is required."}, status=status.HTTP_400_BAD_REQUEST)

        entidad, created = Entidad.objects.get_or_create(url=url)
        serializer = EntidadSerializer(entidad)
        return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


# 2. Crear una interacción nueva (privada o pública)
class CrearInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        data = request.data.copy()
        data['numero_interacciones'] = 0
        data['numero_usuarios_visualizan'] = 0
        data['numero_usuarios_editan'] = 0
        serializer = InteraccionSerializer(data=data)

        if serializer.is_valid():
            interaccion = serializer.save()
            interaccion.usuarios_realizan.add(request.user)
            interaccion.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 3. Compartir una interacción (solo por el creador)
class CompartirInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        data = request.data.copy()
        data['creador'] = request.user.id  # Se establece automáticamente

        serializer = InteraccionCompartidaSerializer(data=data)
        if serializer.is_valid():
            interaccion = serializer.validated_data['interaccion']

            # Verificamos si el usuario actual es el creador de la interacción
            if not InteraccionCompartida.objects.filter(interaccion=interaccion, creador=request.user).exists() and \
               interaccion.entidad.usuario != request.user:  # O si el usuario es dueño de la entidad
                return Response({"error": "Solo el creador puede compartir esta interacción."},
                                status=status.HTTP_403_FORBIDDEN)

            # Guardamos el registro de la compartición
            interaccion_compartida = serializer.save()

            # Añadimos el usuario compartido a los permisos correspondientes
            usuario_destino = interaccion_compartida.compartido_con
            permiso = interaccion_compartida.permiso

            if permiso == 'realiza':
                interaccion.usuarios_realizan.add(usuario_destino)
            elif permiso == 'visualiza':
                interaccion.usuarios_visualizan.add(usuario_destino)

            interaccion.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# 4. Visualizar una interacción (si es pública o si fue compartida)
class VerInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, interaccion_id, format=None):
        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        if not interaccion.privado or \
           interaccion.usuarios_visualizan.filter(id=request.user.id).exists() or \
           InteraccionCompartida.objects.filter(interaccion=interaccion, compartido_con=request.user).exists():
            serializer = InteraccionSerializer(interaccion)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({"error": "No tienes acceso a esta interacción."}, status=status.HTTP_403_FORBIDDEN)
    

# 5. Añadir o actualizar una modificación (por usuario, tipo y elemento) DE MOMENTO ESTA VIEW NO FUNCIONA PORQUE EL UNICO TIPO DE MODIFICACION ES EL DE TEXTO
# class ModificarElementoView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request, format=None):
#         data = request.data
#         try:
#             elemento = Elemento.objects.get(id=data['elemento_id'])
#             interaccion = elemento.interaccion

#             # Verificamos si el usuario puede editar
#             puede_editar = interaccion.usuarios_editan.filter(id=request.user.id).exists() or \
#                            interaccion.usuarios_realizan.filter(id=request.user.id).exists()
#             if not puede_editar:
#                 return Response({"error": "No tienes permiso para editar esta interacción."}, status=status.HTTP_403_FORBIDDEN)

#             # Comprobamos si ya existe una modificación del mismo tipo para ese elemento y usuario
#             modif_existente = Modificacion.objects.filter(
#                 usuario=request.user,
#                 tipo=data['tipo'],
#                 elemento=elemento
#             ).first()

#             if modif_existente:
#                 modif_existente.valor = data['valor']
#                 modif_existente.timestamp = timezone.now()
#                 modif_existente.save()
#                 serializer = ModificacionSerializer(modif_existente)
#                 return Response(serializer.data, status=status.HTTP_200_OK)
#             else:
#                 serializer = ModificacionSerializer(data={
#                     "usuario": request.user.id,
#                     "tipo": data['tipo'],
#                     "valor": data['valor'],
#                     "elemento": data['elemento_id']
#                 })

#                 if serializer.is_valid():
#                     serializer.save()
#                     return Response(serializer.data, status=status.HTTP_201_CREATED)
#                 return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         except Elemento.DoesNotExist:
#             return Response({"error": "Elemento no encontrado."}, status=status.HTTP_404_NOT_FOUND)


# 6. Ver todas las modificaciones de una interacción
class VerModificacionesInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, interaccion_id, format=None):
        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        tiene_acceso = (
            not interaccion.privado or
            interaccion.usuarios_visualizan.filter(id=request.user.id).exists() or
            interaccion.usuarios_editan.filter(id=request.user.id).exists() or
            interaccion.usuarios_realizan.filter(id=request.user.id).exists() or
            InteraccionCompartida.objects.filter(interaccion=interaccion, compartido_con=request.user).exists()
        )

        if not tiene_acceso:
            return Response({"error": "No tienes acceso a esta interacción."}, status=status.HTTP_403_FORBIDDEN)

        modificaciones = Modificacion.objects.filter(interaccion=interaccion)
        serializer = ModificacionSerializer(modificaciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CrearElementoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        data = request.data
        entidad_id = data.get('entidad_id')
        tipo = data.get('tipo')
        selector = data.get('selector')

        try:
            entidad = Entidad.objects.get(id=entidad_id)
        except entidad.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Buscar si ya existe un elemento con ese tipo y selector dentro de la misma interacción
        elemento_existente = Elemento.objects.filter(
            entidad=entidad, tipo=tipo, selector=selector
        ).first()

        if elemento_existente:
            serializer = ElementoSerializer(elemento_existente)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Crear el nuevo elemento
        serializer = ElementoSerializer(data={
            "entidad": entidad_id,
            "tipo": tipo,
            "selector": selector,
            "selected": False
        })

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SeleccionarElementoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        elemento_id = request.data.get('elemento_id')

        try:
            elemento = Elemento.objects.get(id=elemento_id)
        except Elemento.DoesNotExist:
            return Response({"error": "Elemento no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if elemento.selected:
            return Response({"error": "Este elemento ya está siendo editado por otro usuario."}, status=status.HTTP_409_CONFLICT)

        elemento.selected = True
        elemento.save()
        return Response({"msg": "Elemento seleccionado correctamente."}, status=status.HTTP_200_OK)


class DesbloquearElementoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        elemento_id = request.data.get('elemento_id')

        try:
            elemento = Elemento.objects.get(id=elemento_id)
        except Elemento.DoesNotExist:
            return Response({"error": "Elemento no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        elemento.selected = False
        elemento.save()
        return Response({"msg": "Elemento desbloqueado correctamente."}, status=status.HTTP_200_OK)


class ElementosDeInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, interaccion_id, format=None):
        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Obtener todos los elementos relacionados con esa interacción a través de Modificacion
        modificaciones = Modificacion.objects.filter(interaccion=interaccion)
        elementos_ids = modificaciones.values_list('elemento_id', flat=True).distinct()
        elementos = Elemento.objects.filter(id__in=elementos_ids)

        serializer = ElementoSerializer(elementos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)




class CrearModificacionTextoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        usuario = request.user
        data = request.data.copy()

        # Verificar que el elemento no está seleccionado por otro usuario
        try:
            elemento = Elemento.objects.get(id=data['elemento_id'])
        except Elemento.DoesNotExist:
            return Response({"error": "Elemento no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if elemento.selected:
            return Response({"error": "Este elemento ya está siendo modificado por otro usuario"}, status=status.HTTP_409_CONFLICT)

        # Marcar el elemento como seleccionado
        # elemento.selected = True
        # elemento.save()

        # Crear el recurso Texto primero
        texto_serializer = TextoSerializer(data=data.get('texto'))
        texto_serializer.is_valid(raise_exception=True)
        recurso = texto_serializer.save()

        # Crear la modificación
        modificacion_data = {
            'fecha': timezone.now(),
            'interaccion': data['interaccion'],
            'elemento': data['elemento_id'],
            'recurso_texto': recurso.id
        }

        modificacion_serializer = ModificacionSerializer(data=modificacion_data)
        modificacion_serializer.is_valid(raise_exception=True)
        modificacion = modificacion_serializer.save()

        return Response({
            "msg": "Modificación creada correctamente",
            "modificacion": ModificacionSerializer(modificacion).data,
            "recurso": TextoSerializer(recurso).data
        }, status=status.HTTP_201_CREATED)



class VerModificacionesPorEntidadInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, entidad_id, interaccion_id, format=None):
        try:
            entidad = Entidad.objects.get(id=entidad_id)
        except Entidad.DoesNotExist:
            return Response({"error": "Entidad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        modificaciones = Modificacion.objects.filter(
            interaccion_id=interaccion_id,
            elemento__entidad=entidad
        ).select_related('recurso_texto')

        serializer = ModificacionSerializer(modificaciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CrearModificacionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = ModificacionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        modificacion = serializer.save()
        return Response({"msg": "Modificación creada correctamente."}, status=status.HTTP_201_CREATED)


class ModificacionesPorInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, interaccion_id, format=None):
        modificaciones = Modificacion.objects.filter(interaccion_id=interaccion_id).select_related('recurso')
        serializer = ModificacionDetailSerializer(modificaciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
