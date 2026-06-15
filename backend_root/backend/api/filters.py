from django_filters import rest_framework as filters
from .models import Advertisement

class AdvertisementFilter(filters.FilterSet):
    position_type = filters.BaseInFilter(
        field_name='position_type',
        lookup_expr='in'
    )

    salary_min = filters.NumberFilter(
        field_name='salary',
        lookup_expr='gte'
    )
    salary_max = filters.NumberFilter(
        field_name='salary',
        lookup_expr='lte'
    )

    class Meta:
        model = Advertisement
        fields = [
            'position_type',
        ]