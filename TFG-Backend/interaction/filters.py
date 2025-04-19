import django_filters
from interaction.models import Interaccion

class InteraccionFilter(django_filters.FilterSet):
    url = django_filters.CharFilter(field_name='entidad__url', lookup_expr='icontains')
    owner = django_filters.NumberFilter(field_name='owner__id')
    privado = django_filters.BooleanFilter(field_name='privado', method='filter_public_only')

    class Meta:
        model = Interaccion
        fields = ['url', 'owner']

    def filter_public_only(self, queryset, name, value):
        # Ignorar si no se pasó el filtro
        if value is None:
            return queryset.filter(privado=False)
        return queryset.filter(privado=value)
