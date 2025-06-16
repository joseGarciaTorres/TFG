from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from .models import Entidad, Interaccion, InteraccionCompartida, Elemento
from modification.models import ModificacionTexto
from .serializers import (
    EntidadSerializer, InteraccionSerializer, InteraccionCompartidaSerializer, 
    ElementoSerializer, InteraccionPublicaSerializer, InfoInteraccionSerializer
)
from account.models import User
from interaction.filters import InteraccionFilter

# 1. Obtener o crear una entidad desde su URL
class CrearEntidadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        url = request.data.get('url')
        if not url:
            return Response({"error": "URL is required."}, status=status.HTTP_400_BAD_REQUEST)

        entidad = Entidad.objects.create(url=url)
        serializer = EntidadSerializer(entidad)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class ObtenerEntidadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, url, format=None):
        try:
            entidad = Entidad.objects.get(url=url)
        except Entidad.DoesNotExist:
            return Response({"error": "Entidad no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        serializer = EntidadSerializer(entidad)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ObtenerEntidadInteraccionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, url, format=None):
        try:
            interacciones = Interaccion.objects.filter(entidad__url=url, privado=False)
            serializer = InfoInteraccionSerializer(interacciones, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Interaccion.DoesNotExist:
            print("No se encontraron interacciones para esta entidad.")
            return Response({"error": "No se encontraron interacciones para esta entidad."}, status=status.HTTP_404_NOT_FOUND)

class ObtenerInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, url, format=None):
        try:
            entidad = Entidad.objects.get(url=url)
        except Entidad.DoesNotExist:
            return Response({"error": "Entidad no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        try:
            interaccion = Interaccion.objects.get(entidad = entidad, owner = request.user)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interaccion no encontrada."}, status=status.HTTP_404_NOT_FOUND)  
        serializer = InteraccionSerializer(interaccion)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 2. Crear una interacción nueva (privada o pública)
class CrearInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        data = request.data.copy()
        data['numero_interacciones'] = 0
        data['numero_usuarios_visualizan'] = 0
        data['numero_usuarios_editan'] = 0

        interaccion_existente = Interaccion.objects.filter(
            entidad=data.get('entidad'), owner=request.user
        ).first()

        if interaccion_existente:
            serializer = InteraccionSerializer(interaccion_existente)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = InteraccionSerializer(data=data)

        if serializer.is_valid():
            interaccion = serializer.save()
            interaccion = serializer.save(owner=request.user)
            interaccion.usuarios_realizan.add(request.user)
            interaccion.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 3. Compartir una interacción (solo por el creador)
class CompartirInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        # Obtener los campos involucrados
        creador = request.user
        compartido_con = request.data.get('compartido_con')
        permiso = request.data.get('permiso')

        interaccion = Interaccion.objects.get(id=request.data.get('interaccion'))

        if interaccion.owner != creador:
            return Response({"error": "Solo el creador puede compartir esta interacción."},
                status=status.HTTP_403_FORBIDDEN)


        serializer = InteraccionCompartidaSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            # Actualizamos los campos de la interacción según el permiso
            if permiso == 'editar':
                interaccion.usuarios_realizan.add(compartido_con)
            elif permiso == 'visualizar':
                interaccion.usuarios_visualizan.add(compartido_con)

            interaccion.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        else:

            # Verificar si ya existe una compartición
            existing_comparticion = InteraccionCompartida.objects.filter(
                interaccion=interaccion,
                creador=creador,
                compartido_con=compartido_con
            ).first()

            # Si ya existe, verificamos si el permiso ha cambiado
            old_permiso = existing_comparticion.permiso

            if old_permiso != permiso:
                # Si el permiso ha cambiado, actualizamos el permiso
                existing_comparticion.permiso = permiso
                existing_comparticion.save()

                # Actualizamos los campos de la interacción según el nuevo permiso
                if old_permiso == 'editar':
                    interaccion.usuarios_realizan.remove(compartido_con)
                elif old_permiso == 'visualizar':
                    interaccion.usuarios_visualizan.remove(compartido_con)

                if permiso == 'editar':
                    interaccion.usuarios_realizan.add(compartido_con)
                elif permiso == 'visualizar':
                    interaccion.usuarios_visualizan.add(compartido_con)

                interaccion.save()

            return Response(InteraccionCompartidaSerializer(existing_comparticion).data, status=status.HTTP_200_OK)

            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class EliminarComparticionView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, interaccion_id, compartido_con_id, format=None):
        creador = request.user

        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"error": "La interacción no existe."},
                            status=status.HTTP_404_NOT_FOUND)

        if interaccion.owner != creador:
            return Response({"error": "Solo el creador puede administrar esta interacción."},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            compartido_con = User.objects.get(id=compartido_con_id)
        except User.DoesNotExist:
            return Response({"error": "El usuario a eliminar no existe."},
                            status=status.HTTP_404_NOT_FOUND)

        # Buscar y eliminar la compartición
        comparticion = InteraccionCompartida.objects.filter(
            interaccion=interaccion,
            compartido_con=compartido_con
        ).first()

        if comparticion:
            permiso_actual = comparticion.permiso
            comparticion.delete()

            # Quitar del ManyToMany
            if permiso_actual == 'editar':
                interaccion.usuarios_realizan.remove(compartido_con)
            elif permiso_actual == 'visualizar':
                interaccion.usuarios_visualizan.remove(compartido_con)

            interaccion.save()

            return Response({"mensaje": "Compartición eliminada correctamente."},
                            status=status.HTTP_200_OK)
        else:
            return Response({"error": "No se encontró una compartición para este usuario."},
                            status=status.HTTP_404_NOT_FOUND)




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
        interaccion.usuarios_realizan.filter(id=request.user.id).exists():
            serializer = InteraccionSerializer(interaccion)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({"error": "No tienes acceso a esta interacción."}, status=status.HTTP_403_FORBIDDEN)
    
    def delete(self, request, interaccion_id, format=None):
        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Verifica si el usuario actual es el dueño de la interacción
        if interaccion.owner != request.user:
            return Response({"error": "No tienes permiso para eliminar esta interacción."}, status=status.HTTP_403_FORBIDDEN)

        # Al eliminar la interacción, las modificaciones se borran automáticamente por el on_delete=models.CASCADE
        interaccion.delete()

        return Response({"mensaje": "Interacción y modificaciones asociadas eliminadas correctamente."}, status=status.HTTP_204_NO_CONTENT)
    

class MisInteraccionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user

        interacciones_visualiza = Interaccion.objects.filter(usuarios_visualizan=user)
        interacciones_realiza = Interaccion.objects.filter(usuarios_realizan=user)

        # Unir los querysets y quitar duplicados si hay
        interacciones = (interacciones_visualiza | interacciones_realiza).distinct()

        serializer = InfoInteraccionSerializer(interacciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class MisInteraccionesUrlView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, url, format=None):
        user = request.user

        # Filtrar interacciones en las que el usuario participa y la entidad tiene la url dada
        interacciones_visualiza = Interaccion.objects.filter(
            usuarios_visualizan=user,
            entidad__url=url
        )
        interacciones_realiza = Interaccion.objects.filter(
            usuarios_realizan=user,
            entidad__url=url
        )

        # Unir los querysets y quitar duplicados
        interacciones = (interacciones_visualiza | interacciones_realiza).distinct()

        serializer = InfoInteraccionSerializer(interacciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class CrearElementoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        data = request.data
        entidad_id = data.get('entidad_id')
        ruta_dom = data.get('ruta_dom')
        hash_contenido = data.get('hash_contenido')

        try:
            entidad = Entidad.objects.get(id=entidad_id)
        except entidad.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Buscar si ya existe un elemento con ese tipo y selector dentro de la misma interacción
        elemento_existente = Elemento.objects.filter(
            entidad=entidad, ruta_dom=ruta_dom, hash_contenido=hash_contenido
        ).first()

        if elemento_existente:
            serializer = ElementoSerializer(elemento_existente)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Crear el nuevo elemento
        serializer = ElementoSerializer(data={
            "entidad": entidad_id,
            "ruta_dom": ruta_dom,
            "hash_contenido": hash_contenido,
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
        modificaciones = ModificacionTexto.objects.filter(interaccion=interaccion)
        elementos_ids = modificaciones.values_list('elemento', flat=True).distinct()
        elementos = Elemento.objects.filter(id__in=elementos_ids)

        serializer = ElementoSerializer(elementos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    

class BuscarInteraccionesView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        filterset = InteraccionFilter(request.GET, queryset=Interaccion.objects.filter(privado=False))
        if not filterset.is_valid():
            return Response(filterset.errors, status=400)

        queryset = filterset.qs
        serializer = InteraccionSerializer(queryset, many=True)
        return Response(serializer.data)


class UnirseInteraccionPublicaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = request.user
        interaccion_id = request.data.get('interaccion')

        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        if interaccion.privado:
            return Response({"error": "Interacción privada, no tienes acceso."}, status=status.HTTP_403_FORBIDDEN)

        # Verificar si ya está en usuarios_visualizan o usuarios_realizan
        if user in interaccion.usuarios_visualizan.all() or user in interaccion.usuarios_realizan.all():
            return Response({"error": "Ya estás unido a esta interacción."}, status=status.HTTP_403_FORBIDDEN)

        # Añadir al ManyToMany
        interaccion.usuarios_visualizan.add(user)
        interaccion.save()

        return Response({"msg": "Te has unido a la interacción correctamente."}, status=status.HTTP_201_CREATED)



class EliminarUsuariosDeInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, interaccion_id):
        user = request.user
        user_ids = request.data.get('usuarios', [])  # Esperamos un array de IDs

        if not isinstance(user_ids, list):
            return Response({"error": "El campo 'usuarios' debe ser una lista de IDs."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        if interaccion.owner != user:
            return Response({"error": "Solo el creador puede eliminar usuarios de la interacción."}, status=status.HTTP_403_FORBIDDEN)

        eliminados = []

        for uid in user_ids:
            try:
                usuario = User.objects.get(id=uid)
                if usuario in interaccion.usuarios_visualizan.all():
                    interaccion.usuarios_visualizan.remove(usuario)
                    eliminados.append(uid)
                elif usuario in interaccion.usuarios_realizan.all():
                    interaccion.usuarios_realizan.remove(usuario)
                    eliminados.append(uid)
                # Si no está en ninguna, se ignora
            except User.DoesNotExist:
                continue  # Ignorar IDs inválidos

        interaccion.save()

        return Response({"msg": "Usuarios eliminados correctamente.", "usuarios_eliminados": eliminados}, status=status.HTTP_200_OK)
    
class InteraccionesPorUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id, format=None):
        try:
            usuario = User.objects.get(id=usuario_id)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        # Si el usuario autenticado consulta por sí mismo
        if request.user.id == usuario.id:
            interacciones = Interaccion.objects.filter(owner=usuario)
            serializer = InteraccionSerializer(interacciones, many=True)
        else:
            interacciones = Interaccion.objects.filter(owner=usuario, privado=False)
            serializer = InteraccionPublicaSerializer(interacciones, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class UnsubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, interaccion_id):
        user = request.user

        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        if interaccion.owner == user:
            return Response({"error": "El creador no puede desubcribirse de la interaccion."}, status=status.HTTP_403_FORBIDDEN)


        usuario = User.objects.get(id=user.id)
        if usuario in interaccion.usuarios_visualizan.all():
            interaccion.usuarios_visualizan.remove(usuario)

        if usuario in interaccion.usuarios_realizan.all():
            interaccion.usuarios_realizan.remove(usuario)

        interaccion.save()

        return Response({"msg": "Te has desubscrito correctamente"}, status=status.HTTP_200_OK)
    
class CambiarVisibilidadInteraccionView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id, format=None):
        try:
            # Obtener la interacción por ID
            interaccion = Interaccion.objects.get(id=id)
        except Interaccion.DoesNotExist:
            return Response({"error": "Interacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Alternar la visibilidad de la interacción
        interaccion.privado = not interaccion.privado
        interaccion.save()

        return Response(
            {
                "message": "Visibilidad actualizada correctamente.",
                "nueva_visibilidad": interaccion.privado,
            },
            status=status.HTTP_200_OK,
        )
    
class AnularSuscripcionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, interaccion_id, format=None):
        # Obtener la interacción
        interaccion = Interaccion.objects.get(id=interaccion_id)

        # Obtener el usuario autenticado
        usuario = request.user

        # Eliminar al usuario de la lista de visualizadores si está presente
        if interaccion.usuarios_visualizan.filter(id=usuario.id).exists():
            interaccion.usuarios_visualizan.remove(usuario)
            interaccion.numero_usuarios_visualizan = max(0, interaccion.numero_usuarios_visualizan - 1)
            interaccion.save()

        # Eliminar al usuario de la lista de realizadores si está presente
        if interaccion.usuarios_realizan.filter(id=usuario.id).exists():
            interaccion.usuarios_realizan.remove(usuario)
            interaccion.numero_usuarios_editan = max(0, interaccion.numero_usuarios_editan - 1)
            interaccion.save()

        # Eliminar al usuario del modelo InteraccionCompartida si está presente
        InteraccionCompartida.objects.filter(interaccion=interaccion, compartido_con=usuario).delete()

        return Response({"message": "Suscripción anulada correctamente."}, status=status.HTTP_200_OK)
