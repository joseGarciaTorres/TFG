from django.db import models
from account.models import User
from interaction.models import Interaccion


class Foro(models.Model):
    interaccion = models.OneToOneField(Interaccion, on_delete=models.CASCADE, related_name="foro")

    def __str__(self):
        return f"Foro de la interacción {self.interaccion.id}"

class Comentario(models.Model):
    foro = models.ForeignKey(Foro, related_name="comentarios", on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, related_name="comentarios_publicados", on_delete=models.CASCADE)
    contenido = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    comentario_padre = models.ForeignKey('self', related_name='respuestas', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"Comentario de {self.usuario.name} en Foro {self.foro.id}"
