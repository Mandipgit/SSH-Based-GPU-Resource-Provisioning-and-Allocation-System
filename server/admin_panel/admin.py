from django.contrib import admin
from .models import SystemSetting, SystemLog


class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'is_public', 'created_at')
    search_fields = ('key', 'description')
    readonly_fields = ('created_at', 'updated_at')


class SystemLogAdmin(admin.ModelAdmin):
    list_display = ('level', 'source', 'message', 'created_at')
    list_filter = ('level', 'source')
    search_fields = ('source', 'message')
    readonly_fields = ('created_at',)


admin.site.register(SystemSetting, SystemSettingAdmin)
admin.site.register(SystemLog, SystemLogAdmin)