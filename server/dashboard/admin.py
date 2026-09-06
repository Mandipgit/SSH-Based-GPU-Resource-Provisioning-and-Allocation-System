from django.contrib import admin
from .models import DashboardWidget, PlatformAnalytics, UserActivityLog


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'widget_type', 'position', 'is_active', 'created_at')
    list_filter = ('widget_type', 'is_active', 'created_at')
    search_fields = ('user__email', 'widget_type')
    ordering = ('user', 'position')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'


@admin.register(PlatformAnalytics)
class PlatformAnalyticsAdmin(admin.ModelAdmin):
    list_display = (
        'date',
        'total_users',
        'total_hosts',
        'total_gpus',
        'total_sessions',
        'active_sessions',
        'total_revenue',
        'platform_fees',
        'new_users',
        'new_sessions',
    )
    list_filter = ('date',)
    ordering = ('-date',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(UserActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'action', 'ip_address', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__email', 'action', 'ip_address')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

    def user_email(self, obj):
        return obj.user.email if obj.user else 'System/Anonymous'
    user_email.short_description = 'User'
