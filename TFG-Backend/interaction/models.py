from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Entidad(models.Model):
    url = models.URLField(unique=True)

    def __str__(self):
        return self.url


class Elemento(models.Model):
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name='elementos')
    tipo = models.CharField(max_length=50)  # ej. h1, div, p
    selector = models.CharField(max_length=255)  # ej. #main-title o .header
    selected = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.tipo} - {self.selector}"


class Interaccion(models.Model):
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name='interacciones')
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



class Texto(models.Model):
    tamaño_letra = models.CharField(max_length=20)
    color_letra = models.CharField(max_length=20)
    color_fondo_letra = models.CharField(max_length=20)
    estilo_letra = models.CharField(max_length=20)
    inicio = models.PositiveIntegerField()
    fin = models.PositiveIntegerField()
    textoOriginal = models.TextField()
    textoModificado = models.TextField()
    def __str__(self):
        return f"Texto desde {self.inicio} hasta {self.fin}"


class Modificacion(models.Model):
    interaccion = models.ForeignKey(Interaccion, on_delete=models.CASCADE, related_name='modificaciones')
    elemento = models.ForeignKey(Elemento, on_delete=models.CASCADE, related_name='modificaciones')
    recurso_texto = models.ForeignKey(Texto, on_delete=models.CASCADE, related_name='modificaciones')  # por ahora solo Texto
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Modificación {self.id} en elemento {self.elemento}"
