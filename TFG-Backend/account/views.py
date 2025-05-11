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