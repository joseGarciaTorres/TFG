from rest_framework import serializers

from .models import (
    Entidad, Elemento, Interaccion,
    InteraccionCompartida, Texto, Modificacion
)

class EntidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entidad
        fields = ['id', 'url']


class ElementoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Elemento
        fields = ['id', 'entidad', 'tipo', 'selector', 'selected']


class InteraccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interaccion
        fields = [
            'id', 'entidad', 'privado', 'numero_interacciones',
            'numero_usuarios_visualizan', 'numero_usuarios_editan',
            'usuarios_realizan', 'usuarios_visualizan'
        ]
        read_only_fields = ['usuarios_realizan', 'usuarios_visualizan']


class InteraccionCompartidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteraccionCompartida
        fields = ['id', 'interaccion', 'creador', 'compartido_con', 'permiso']
        read_only_fields = ['creador']



class TextoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Texto
        fields = [
            'id', 'tamaño_letra', 'color_letra', 'color_fondo_letra',
            'estilo_letra', 'inicio', 'fin', 'textoOriginal', 'textoModificado'
        ]


class ModificacionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Modificacion
        fields = ['id', 'interaccion', 'elemento', 'recurso_texto', 'fecha']

    def create(self, validated_data):
        texto = validated_data.pop('recurso_texto')  # Ya es una instancia de Texto

        existing_mod = Modificacion.objects.filter(
            interaccion=validated_data['interaccion'],
            elemento=validated_data['elemento']
        ).first()

        if existing_mod:
            existing_mod.recurso_texto.delete()
            existing_mod.recurso_texto = texto
            existing_mod.fecha = validated_data.get('fecha', existing_mod.fecha)
            existing_mod.save()
            return existing_mod

        return Modificacion.objects.create(recurso_texto=texto, **validated_data)



class TextoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Texto
        fields = [
            'id',
            'tamaño_letra',
            'color_letra',
            'color_fondo_letra',
            'estilo_letra',
            'inicio',
            'fin',
            'textoOriginal',
            'textoModificado',
        ]



class TextoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Texto
        fields = '__all__'


class ModificacionCreateSerializer(serializers.ModelSerializer):
    tipo_recurso = serializers.CharField(write_only=True)
    recurso = TextoCreateSerializer()

    class Meta:
        model = Modificacion
        fields = ['id', 'fecha', 'interaccion', 'elemento', 'tipo_recurso', 'recurso']

    def create(self, validated_data):
        tipo_recurso = validated_data.pop('tipo_recurso')
        recurso_data = validated_data.pop('recurso')

        # Creamos el recurso según el tipo
        if tipo_recurso == 'texto':
            recurso_base = Texto.objects.create()
            texto = Texto.objects.create(**recurso_data, recurso_ptr=recurso_base)
            recurso = texto
        else:
            raise serializers.ValidationError("Tipo de recurso no soportado")

        # Creamos la modificación asociada al recurso
        modificacion = Modificacion.objects.create(recurso=recurso, **validated_data)
        return modificacion

