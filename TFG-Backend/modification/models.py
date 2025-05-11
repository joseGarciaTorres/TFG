from django.db import models
from interaction.models import Interaccion, Elemento

class ModificacionBase(models.Model):
    interaccion = models.ForeignKey(
        Interaccion,
        on_delete=models.CASCADE,
        related_name='%(class)s_modificaciones'  # Se transforma en 'modificaciontexto_modificaciones', etc.
    )
    elemento = models.ForeignKey(
        Elemento,
        on_delete=models.CASCADE,
        related_name='%(class)s_modificaciones'
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class ModificacionTexto(ModificacionBase):
    tamaño_letra = models.CharField(max_length=20, blank=True, null=True)
    color_letra = models.CharField(max_length=20, blank=True, null=True)
    color_fondo_letra = models.CharField(max_length=20, blank=True, null=True)
    estilo_letra = models.CharField(max_length=20, blank=True, null=True)
    inicio = models.PositiveIntegerField(blank=True, null=True)
    fin = models.PositiveIntegerField(blank=True, null=True)
    textoOriginal = models.TextField(blank=True, null=True)
    textoModificado = models.TextField(blank=True, null=True)
    bold = models.BooleanField(blank=True, null=True)
    italic = models.BooleanField(blank=True, null=True)
    underline = models.BooleanField(blank=True, null=True)
    def __str__(self):
        return f"Texto desde {self.inicio} hasta {self.fin}"

# Las siguientes son placeholders para cuando tengas Anotacion o Elemento
class ModificacionAnotacion(ModificacionBase):
    contenido = models.TextField(blank=True, null=True)
    modificacionTextoId = models.ForeignKey(
        ModificacionTexto,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='modificacion_tipo_anotacion'
    )

class ModificacionElemento(ModificacionBase):
    forma = models.FileField(blank=True, null=True)
# recurso = models.ForeignKey(RecursoElemento, ...)
    nombre_elemento = models.CharField(max_length=100)