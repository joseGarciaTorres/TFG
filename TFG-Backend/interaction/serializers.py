from rest_framework import serializers
from account.models import User

from .models import (
    Entidad, Elemento, Interaccion,
    InteraccionCompartida
)

class EntidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entidad
        fields = ['id', 'url']


class ElementoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Elemento
        fields = ['id', 'entidad', 'ruta_dom', 'hash_contenido', 'selected']


class InteraccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interaccion
        fields = '__all__'
        read_only_fields = ['usuarios_realizan', 'usuarios_visualizan', 'owner']


class InfoInteraccionSerializer(serializers.ModelSerializer):
    entidad = serializers.CharField(source='entidad.url', read_only=True)
    #owner = serializers.CharField(source='owner.name', read_only=True)

    class Meta:
        model = Interaccion
        fields = '__all__'


class InteraccionCompartidaSerializer(serializers.ModelSerializer):
    interaccion = serializers.PrimaryKeyRelatedField(queryset=Interaccion.objects.all())
    creador = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = InteraccionCompartida
        fields = '__all__'
        read_only_fields = ['creador']
    

class InteraccionPublicaSerializer(serializers.ModelSerializer):
    entidad = serializers.CharField(source='entidad.url')
    owner = serializers.CharField(source='owner.name')
    usuarios_visualizan = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )

    class Meta:
        model = Interaccion
        fields = ['id', 'entidad', 'owner', 'usuarios_visualizan']


