# gpus/filters.py
from rest_framework import filters
from django.db.models import Q


class GPUFilter(filters.BaseFilterBackend):
    """Custom filter for GPU listing"""
    
    def filter_queryset(self, request, queryset, view):
        params = request.query_params
        
        # Filter by VRAM
        min_vram = params.get('min_vram')
        if min_vram:
            queryset = queryset.filter(vram_gb__gte=min_vram)
        
        max_vram = params.get('max_vram')
        if max_vram:
            queryset = queryset.filter(vram_gb__lte=max_vram)
        
        # Filter by price
        min_price = params.get('min_price')
        if min_price:
            queryset = queryset.filter(price_per_hour__gte=min_price)
        
        max_price = params.get('max_price')
        if max_price:
            queryset = queryset.filter(price_per_hour__lte=max_price)
        
        # Filter by location
        location = params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by availability
        available_only = params.get('available_only')
        if available_only and available_only.lower() == 'true':
            queryset = queryset.filter(is_available=True)
        
        # Search by GPU name (FIXED: use correct field names)
        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(gpu_name__icontains=search) |
                Q(host__user__email__icontains=search) |
                Q(location__icontains=search)
            )
        
        min_uptime = params.get('min_uptime')  # ← Get from params with correct key
        if min_uptime:
            queryset = queryset.filter(host__uptime_percentage__gte=min_uptime)
        
        return queryset



# GPUSortFilter - For sorting GPUs


class GPUSortFilter(filters.BaseFilterBackend):
    """Custom sort filter for GPU listing"""
    
    def filter_queryset(self, request, queryset, view):
        sort_by = request.query_params.get('sort_by', 'price')
        sort_order = request.query_params.get('sort_order', 'asc')
        
        if sort_by == 'rating':
            from django.db.models import Avg, Value, FloatField
            from django.db.models.functions import Coalesce
            queryset = queryset.annotate(
                avg_rating=Coalesce(Avg('reviews__rating'), Value(0.0), output_field=FloatField())
            )
            field = '-avg_rating' if sort_order == 'desc' else 'avg_rating'
            return queryset.order_by(field)

        # Map sort fields to model fields
        sort_map = {
            'price': 'price_per_hour',
            'vram': 'vram_gb',
            'uptime': 'host__uptime_percentage',
            'created': 'created_at',
            'sessions': 'total_sessions',
            'earnings': 'total_earnings',
        }
        
        field = sort_map.get(sort_by, 'price_per_hour')
        
        if sort_order == 'desc':
            field = f'-{field}'
        
        return queryset.order_by(field)