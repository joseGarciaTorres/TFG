from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Entidad(models.Model):
    url = models.URLField(unique=True)

    def __str__(self):
        return self.url


class Elemento(models.Model):
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name='elementos')
    ruta_dom = models.TextField(blank=True, null=True)  # Ruta completa del DOM
    hash_contenido = models.CharField(max_length=64, blank=True, null=True)  # Hash del contenido original
    selected = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.tipo} - {self.selector}"


class Interaccion(models.Model):
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name='interacciones')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interacciones_creadas', null=True)
    privado = models.BooleanField(default=False)
    numero_interacciones = models.PositiveIntegerField(default=0)
    numero_usuarios_visualizan = models.PositiveIntegerField(default=0)
    numero_usuarios_editan = models.PositiveIntegerField(default=0)
    usuarios_realizan = models.ManyToManyField(User, related_name='interacciones_realizadas', blank=True)
    usuarios_visualizan = models.ManyToManyField(User, related_name='interacciones_visualizadas', blank=True)

    def __str__(self):
        return f"Interacción {self.id} sobre {self.entidad.url}"


class InteraccionCompartida(models.Model):
    PERMISOS = (
        ('visualizar', 'Visualizar'),
        ('editar', 'Editar'),
    )

    interaccion = models.ForeignKey(Interaccion, on_delete=models.CASCADE, related_name='compartidas')
    creador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interacciones_compartidas')
    compartido_con = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interacciones_recibidas')
    permiso = models.CharField(max_length=10, choices=PERMISOS)

    class Meta:
        unique_together = ('interaccion', 'creador', 'compartido_con')

    def __str__(self):
        return f"{self.creador} → {self.compartido_con} ({self.permiso})"

