# serializers.py
from rest_framework import serializers
from .models import ModificacionTexto, ModificacionAnotacion, ModificacionElemento

class ModificacionTextoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModificacionTexto
        fields = '__all__'
        read_only_fields = ['interaccion', 'elemento']

class ModificacionAnotacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModificacionAnotacion
        fields = '__all__'
        read_only_fields = ['interaccion', 'elemento']

class ModificacionElementoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModificacionElemento
        fields = '__all__'
        read_only_fields = ['interaccion', 'elemento']
