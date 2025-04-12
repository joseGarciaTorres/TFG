from rest_framework import serializers
from .models import Comentario

class ComentarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comentario
        fields = ['id', 'foro', 'usuario', 'contenido', 'fecha', 'comentario_padre']
        read_only_fields = ['usuario', 'fecha', 'foro']

    def validate_contenido(self, value):
        if not value.strip():
            raise serializers.ValidationError("El contenido del comentario no puede estar vacío.")
        return value
