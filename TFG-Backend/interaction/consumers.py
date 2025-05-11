import json
from channels.generic.websocket import AsyncWebsocketConsumer
from account.models import User
from interaction.models import Interaccion, Elemento
from modification.models import ModificacionTexto, ModificacionAnotacion
from modification.serializers import ModificacionTextoSerializer, ModificacionAnotacionSerializer
from modification.utils import validar_interaccion_y_elemento
from asgiref.sync import sync_to_async

class InteractionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.id = self.scope['url_route']['kwargs']['id']
        self.group_name = f'interaccion_{self.id}'

        # Unirte al grupo de interacción
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'modificacion_texto':
            data['data'] = await self.save_modificacion_texto(data['data'])
        elif data['type'] == 'modificacion_nota':
            data['data'] = await self.save_modificacion_nota(data['data'])
        elif data['type'] == 'delete_modificacion':
            data['data'] = await self.delete_modificacion(data['data'])

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'broadcast_modification',
                'data': data
            }
        )

    async def broadcast_modification(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def save_modificacion_texto(self, data):
        print(data)    
        # Usa sync_to_async para operaciones de base de datos
        try:
            interaccion = await sync_to_async(Interaccion.objects.get)(id=data['interaccion'])
        except Interaccion.DoesNotExist:
            print("Interacción no encontrada")
            return  # Manejar errores si es necesario
        
        try:
            elemento = await sync_to_async(Elemento.objects.get)(id=data['elemento'])
        except Elemento.DoesNotExist:
            print("Elemento no encontrado")
            return
    
        serializer = ModificacionTextoSerializer(data=data)
        if serializer.is_valid():
            print("Datos válidos")
            instance = await sync_to_async(serializer.save)(interaccion=interaccion, elemento=elemento)
            return ModificacionTextoSerializer(instance).data  # Devuelve los datos serializados
        else:
            print("Errores en el serializer:", serializer.errors)
            return data  # Devuelve el data original si el serializer no es válido

    async def save_modificacion_nota(self, data):
        try:
            # Usa sync_to_async para envolver la llamada a Interaccion.objects.get
            interaccion = await sync_to_async(Interaccion.objects.get)(id=data['interaccion'])
        except Interaccion.DoesNotExist:
            return  # Manejar errores si es necesario

        try:
            # Usa sync_to_async para envolver la llamada a ModificacionTexto.objects.get
            modificacion_texto = await sync_to_async(ModificacionTexto.objects.get)(id=data.get('modificacionTextoId'))
            # Usa sync_to_async para acceder a la relación elemento
            elemento = await sync_to_async(lambda: modificacion_texto.elemento)()
        except ModificacionTexto.DoesNotExist:
            return  # Manejar errores si es necesario

        # Usa sync_to_async para envolver la llamada a ModificacionAnotacion.objects.filter().first()
        existing_anotacion = await sync_to_async(lambda: ModificacionAnotacion.objects.filter(modificacionTextoId=data.get('modificacionTextoId')).first())()

        if existing_anotacion:
            # Actualiza la anotación existente
            existing_anotacion.contenido = data.get('contenido')
            await sync_to_async(existing_anotacion.save)()
            return ModificacionAnotacionSerializer(existing_anotacion).data
        else:
            # Crea una nueva anotación
            serializer = ModificacionAnotacionSerializer(data=data)
            is_valid = await sync_to_async(serializer.is_valid)()
            if is_valid:
                instance = await sync_to_async(serializer.save)(modificacionTextoId=modificacion_texto, interaccion=interaccion, elemento=elemento)
                return ModificacionAnotacionSerializer(instance).data
        return data

    async def get_interaction_users(self):
        interaccion_id = self.scope['url_route']['kwargs']['interaccion_id']
        try:
            interaccion = Interaccion.objects.get(id=interaccion_id)
        except Interaccion.DoesNotExist:
            return []

        usuarios_visualizan = interaccion.usuarios_visualizan.all()
        usuarios_realizan = interaccion.usuarios_realizan.all()
        return list(set(usuarios_visualizan) | set(usuarios_realizan))
    
    async def delete_modificacion(self, data):
        try:
            # Usa sync_to_async para envolver la llamada a ModificacionTexto.objects.get
            modificacion_texto = await sync_to_async(ModificacionTexto.objects.get)(id=data['modificacionTextoId'])
        except ModificacionTexto.DoesNotExist:
            return
        # Usa sync_to_async para envolver la llamada a ModificacionAnotacion.objects.filter().first()
        if(modificacion_texto):
            # Elimina la modificación de texto
            await sync_to_async(modificacion_texto.delete)()
            # Elimina la anotación asociada 