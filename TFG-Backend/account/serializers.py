from rest_framework import serializers
from account.models import User, FriendRequest
from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from account.utils import Util

class UserRegistrationSerializer(serializers.ModelSerializer):
  # We are writing this becoz we need confirm password field in our Registratin Request
  password2 = serializers.CharField(style={'input_type':'password'}, write_only=True)
  class Meta:
    model = User
    fields=['email', 'name', 'password', 'password2', 'tc']
    extra_kwargs={
      'password':{'write_only':True}
    }

  # Validating Password and Confirm Password while Registration
  def validate(self, attrs):
    password = attrs.get('password')
    password2 = attrs.get('password2')
    if password != password2:
      raise serializers.ValidationError("Password and Confirm Password doesn't match")
    return attrs

  def create(self, validate_data):
    return User.objects.create_user(**validate_data)

class UserLoginSerializer(serializers.ModelSerializer):
  email = serializers.EmailField(max_length=255)
  class Meta:
    model = User
    fields = ['email', 'password']

class UserProfileSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['id', 'email', 'name', 'first_name', 'last_name', 'profile_image', 'friends']

class UserSearchSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['id', 'email', 'name', 'bio', 'profile_image', 'friends']

class UserChangePasswordSerializer(serializers.Serializer):
  password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  class Meta:
    fields = ['password', 'password2']

  def validate(self, attrs):
    password = attrs.get('password')
    password2 = attrs.get('password2')
    user = self.context.get('user')
    if password != password2:
      raise serializers.ValidationError("Password and Confirm Password doesn't match")
    user.set_password(password)
    user.save()
    return attrs

class SendPasswordResetEmailSerializer(serializers.Serializer):
  email = serializers.EmailField(max_length=255)
  class Meta:
    fields = ['email']

  def validate(self, attrs):
    email = attrs.get('email')
    if User.objects.filter(email=email).exists():
      user = User.objects.get(email = email)
      uid = urlsafe_base64_encode(force_bytes(user.id))
      print('Encoded UID', uid)
      token = PasswordResetTokenGenerator().make_token(user)
      print('Password Reset Token', token)
      link = 'http://localhost:8000/api/user/reset-password/'+uid+'/'+token+'/'
      print('Password Reset Link', link)
      # Send EMail
      body = 'Click Following Link to Reset Your Password '+link
      data = {
        'subject':'Reset Your Password',
        'body':body,
        'to_email':user.email
      }
      Util.send_email(data)
      return attrs
    else:
      raise serializers.ValidationError('You are not a Registered User')

class UserPasswordResetSerializer(serializers.Serializer):
  password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  class Meta:
    fields = ['password', 'password2']

  def validate(self, attrs):
    try:
      password = attrs.get('password')
      password2 = attrs.get('password2')
      uid = self.context.get('uid')
      token = self.context.get('token')
      if password != password2:
        raise serializers.ValidationError("Password and Confirm Password doesn't match")
      id = smart_str(urlsafe_base64_decode(uid))
      user = User.objects.get(id=id)
      if not PasswordResetTokenGenerator().check_token(user, token):
        raise serializers.ValidationError('Token is not Valid or Expired')
      user.set_password(password)
      user.save()
      return attrs
    except DjangoUnicodeDecodeError as identifier:
      PasswordResetTokenGenerator().check_token(user, token)
      raise serializers.ValidationError('Token is not Valid or Expired')
    

class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ['to_user', 'timestamp']
    
    def create(self, validated_data):
      request = self.context.get('request')
      from_user = request.user
      validated_data['from_user'] = from_user
      to_user = validated_data['to_user']

      # No puedes mandarte una solicitud a ti mismo
      if from_user == to_user:
          raise serializers.ValidationError("You cannot send a friend request to yourself.")
      
      # Ya sois amigos
      if to_user in from_user.friends.all():
          raise serializers.ValidationError("You are already friends with this user.")

      # Ya existe una solicitud pendiente
      if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
          raise serializers.ValidationError("Friend request already sent.")
      
      if FriendRequest.objects.filter(from_user=to_user, to_user=from_user).exists():
        raise serializers.ValidationError("This user has already sent you a friend request.")


      return FriendRequest.objects.create(**validated_data)   


class AcceptFriendRequestSerializer(serializers.Serializer):
    from_user_id = serializers.IntegerField()

    def validate(self, attrs):
        user = self.context['user']
        from_user_id = attrs['from_user_id']
        from_user = User.objects.get(id=from_user_id)

        # Verificar si la solicitud de amistad existe
        frequest = FriendRequest.objects.filter(from_user=from_user, to_user=user).first()
        if not frequest:
            raise serializers.ValidationError("No friend request to accept")
        
        # Aceptar la solicitud de amistad
        user.friends.add(from_user)
        from_user.friends.add(user)
        frequest.delete()  # Eliminar la solicitud de amistad después de aceptarla
        
        return attrs

class CancelFriendRequestSerializer(serializers.Serializer):
    from_user_id = serializers.IntegerField()

    def validate(self, attrs):
        user = self.context['user']
        from_user_id = attrs['from_user_id']
        from_user = User.objects.get(id=from_user_id)

        # Cancelar la solicitud de amistad
        frequest = FriendRequest.objects.filter(from_user=from_user, to_user=user).first()
        if frequest:
            frequest.delete()
        return attrs


class DeleteFriendRequestSerializer(serializers.Serializer):
    from_user_id = serializers.IntegerField()

    def validate(self, attrs):
        user = self.context['user']
        from_user_id = attrs.get('from_user_id')
        from_user = User.objects.get(id=from_user_id)
        frequest = FriendRequest.objects.filter(from_user=from_user, to_user=user).first()
        if not frequest:
            raise serializers.ValidationError("No such friend request exists")
        frequest.delete()
        return attrs

class RemoveFriendSerializer(serializers.Serializer):
    friend_id = serializers.IntegerField()

    def validate(self, attrs):
        user = self.context['user']
        friend_id = attrs.get('friend_id')
        friend = User.objects.get(id=friend_id)
        if friend not in user.friends.all():
            raise serializers.ValidationError("User is not your friend")
        user.friends.remove(friend)
        friend.friends.remove(user)
        return attrs


class FriendRequestListSerializer(serializers.ModelSerializer):
    from_user_name = serializers.CharField(source='from_user.name', read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'from_user_name', 'timestamp']