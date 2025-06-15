from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from account.serializers import AcceptFriendRequestSerializer, CancelFriendRequestSerializer, DeleteFriendRequestSerializer, FriendRequest, FriendRequestListSerializer, FriendRequestSerializer, RemoveFriendSerializer, SendPasswordResetEmailSerializer, UserChangePasswordSerializer, UserLoginSerializer, UserProfileSerializer, UserPasswordResetSerializer, UserRegistrationSerializer, UserSearchSerializer
from account.renderers import UserRenderer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import FriendRequest
from django.db.models import Q
from .models import User
from foro.models import Foro
from interaction.models import Interaccion
import random
import string


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class UserRegistrationView(APIView):
  renderer_classes = [UserRenderer]
  def post(self,request,format=None):
    serializer =  UserRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token = get_tokens_for_user(user)
    return Response({'token':token,'msg':'Registration Success'},status=status.HTTP_201_CREATED)


class UserLoginView(APIView):
  renderer_classes = [UserRenderer]
  def post(self, request, format=None):
    serializer =  UserLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.data.get('email')
    password = serializer.data.get('password')
    user = authenticate(email=email, password=password)
    if user is not None:
      token = get_tokens_for_user(user)
      return Response({'token':token,'msg':'Login Success'}, status=status.HTTP_200_OK)
    else:
      return Response({'errors':{'non_field_errors':['Email or Password is not Valid']}}, status=status.HTTP_404_NOT_FOUND)
    

class UserProfileView(APIView):
  renderer_classes = [UserRenderer]
  permission_classes = [IsAuthenticated]
  def get(self, request, format=None):
    serializer =  UserProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)
  
  def put(self, request, format=None):
        # Obtener los datos enviados en la solicitud
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        bio = request.data.get('bio')
        friends_to_remove = request.data.get('friends_to_remove', [])

        # Actualizar el perfil del usuario
        user = request.user
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        if bio:
           user.bio = bio
        user.save()

        # Eliminar amigos si se proporciona un array de IDs
        for friend_id in friends_to_remove:
            try:
                friend = User.objects.get(id=friend_id)
                if friend in user.friends.all():
                    user.friends.remove(friend)
                    friend.friends.remove(user)
            except User.DoesNotExist:
                return Response({'error': f'User with ID {friend_id} does not exist'}, status=status.HTTP_400_BAD_REQUEST)


        return Response({'msg': 'Profile updated successfully'}, status=status.HTTP_200_OK)

  
class UserChangePasswordView(APIView):
  renderer_classes = [UserRenderer]
  permission_classes = [IsAuthenticated]
  def post(self, request, format=None):
    serializer =  UserChangePasswordSerializer(data=request.data, context={'user':request.user})
    serializer.is_valid(raise_exception=True)
    return Response({'msg':'Password Changed Successfully'}, status=status.HTTP_200_OK)

  
class SendPasswordResetEmailView(APIView):
  renderer_classes = [UserRenderer]
  def post(self, request, format=None):
    serializer =  SendPasswordResetEmailSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response({'msg':'Password Reset link send. Please check your Email'}, status=status.HTTP_200_OK)

class UserPasswordResetView(APIView):
  renderer_classes = [UserRenderer]
  def post(self, request, uid, token, format=None):
    serializer =  UserPasswordResetSerializer(data=request.data, context={'uid':uid, 'token':token})
    serializer.is_valid(raise_exception=True)
    return Response({'msg':'Password Reset Successfully'}, status=status.HTTP_200_OK)
  

class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        serializer = FriendRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"msg": "Friend request sent successfully."}, status=status.HTTP_201_CREATED)

class AcceptFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        serializer =  AcceptFriendRequestSerializer(data=request.data, context={'user': request.user})
        serializer.is_valid(raise_exception=True)
        return Response({"msg": "Friend request accepted successfully."}, status=status.HTTP_200_OK)

class CancelFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        serializer =  CancelFriendRequestSerializer(data=request.data, context={'user': request.user})
        serializer.is_valid(raise_exception=True)
        return Response({"msg": "Friend request canceled successfully."}, status=status.HTTP_200_OK)

class DeleteFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer =  DeleteFriendRequestSerializer(data=request.data, context={'user': request.user})
        serializer.is_valid(raise_exception=True)
        return Response({"msg": "Friend request deleted"}, status=status.HTTP_200_OK)

class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer =  RemoveFriendSerializer(data=request.data, context={'user': request.user})
        serializer.is_valid(raise_exception=True)
        return Response({"msg": "Friend removed successfully"}, status=status.HTTP_200_OK)

class FriendRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        frequests = FriendRequest.objects.filter(to_user=request.user)
        serializer =  FriendRequestListSerializer(frequests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



# Muestra todos los usuarios si no hay filtros
# Excluye al usuario autenticado de los resultados
# Permite filtrar por name, email, first_name, last_name
# Si se pasa ?friends_in_common=true, muestra solo quienes tienen algún amigo en común con el usuario logueado
class UserSearchView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        query_params = request.query_params

        name = query_params.get('name')
        email = query_params.get('email')
        first_name = query_params.get('first_name')
        last_name = query_params.get('last_name')
        friends_in_common = query_params.get('friends_in_common', '').lower() == 'true'

        queryset = User.objects.all()

        if user:
            queryset = queryset.exclude(id=user.id)

        if name:
            queryset = queryset.filter(name__icontains=name)
        if email:
            queryset = queryset.filter(email__icontains=email)
        if first_name:
            queryset = queryset.filter(first_name__icontains=first_name)
        if last_name:
            queryset = queryset.filter(last_name__icontains=last_name)

        if user and friends_in_common:
            user_friends = user.friends.all()
            queryset = queryset.filter(friends__in=user_friends).distinct()

        serializer = UserSearchSerializer(queryset, many=True)
        return Response(serializer.data)
    
class GoogleUserView(APIView):
    def post(self, request, format=None):
        email = request.data.get('email')

        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verificar si el usuario ya existe
            user = User.objects.get(email=email)
            return Response({'email': user.email, 'password': user.password}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # Generar una contraseña aleatoria
            generated_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            username = email.split('@')[0]  # Usar el nombre del correo como nombre de usuario

            # Crear un nuevo usuario
            user = User.objects.create_user(
                email=email,
                name=username,
                tc=True,
                password=generated_password
            )

            return Response({'email': user.email, 'password': generated_password}, status=status.HTTP_201_CREATED)
        
class ExpecificUserProfileView(APIView):
    def get(self, request, user_id):
        try:
            # Obtener el usuario por ID
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "El usuario no existe."}, status=status.HTTP_404_NOT_FOUND)

        # Obtener las interacciones públicas del usuario
        interacciones_publicas = Interaccion.objects.filter(owner=user, privado=False)

        # Serializar las interacciones públicas
        interacciones_data = []
        for interaccion in interacciones_publicas:
            foro = Foro.objects.filter(interaccion=interaccion).first()  # Obtener el foro asociado
            interacciones_data.append({
                "id": interaccion.id,
                "url": interaccion.entidad.url,
                "foro_id": foro.id if foro else None,
                "usuarios_visualizan": [usuario.name for usuario in interaccion.usuarios_visualizan.all()],
                "usuarios_realizan": [usuario.name for usuario in interaccion.usuarios_realizan.all()],
            })

        # Construir la respuesta
        data = {
            "name": user.name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "bio": user.bio,
            "interacciones_publicas": interacciones_data,
        }

        return Response(data, status=status.HTTP_200_OK)