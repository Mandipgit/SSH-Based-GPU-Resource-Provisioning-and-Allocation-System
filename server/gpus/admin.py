from django.contrib import admin
from .models import GPU


class GPUAdmin(admin.ModelAdmin):
    list_display = (
        'gpu_name', 'host', 'vram_gb', 'price_per_hour',
        'is_available', 'total_sessions', 'created_at'
    )
    list_filter = ('is_available', 'vram_gb', 'created_at')
    search_fields = ('gpu_name', 'host__user__email', 'location')
    readonly_fields = ('total_rental_hours', 'total_earnings', 'total_sessions')
    
    fieldsets = (
        ('GPU Information', {
            'fields': ('host', 'gpu_name', 'vram_total', 'vram_gb')
        }),
        ('Specifications', {
            'fields': ('cuda_cores', 'memory_bandwidth', 'compute_capability',
                      'driver_version', 'cuda_version')
        }),
        ('Pricing & Availability', {
            'fields': ('price_per_hour', 'is_available', 'current_session_id')
        }),
        ('Location', {
            'fields': ('location',)
        }),
        ('Statistics', {
            'fields': ('total_rental_hours', 'total_earnings', 'total_sessions')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


admin.site.register(GPU, GPUAdmin)