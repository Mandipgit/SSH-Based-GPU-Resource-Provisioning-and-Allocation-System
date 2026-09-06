from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'renter_email',
        'host_email',
        'gpu_name',
        'rating',
        'communication_rating',
        'reliability_rating',
        'gpu_performance_rating',
        'is_verified',
        'created_at',
    )
    list_filter = ('rating', 'is_verified', 'created_at')
    search_fields = (
        'renter__email',
        'host__user__email',
        'gpu__gpu_name',
        'comment',
        'host_response',
    )
    readonly_fields = ('created_at', 'updated_at')

    def renter_email(self, obj):
        return obj.renter.email
    renter_email.short_description = 'Renter'

    def host_email(self, obj):
        return obj.host.user.email
    host_email.short_description = 'Host'

    def gpu_name(self, obj):
        return obj.gpu.gpu_name
    gpu_name.short_description = 'GPU'

