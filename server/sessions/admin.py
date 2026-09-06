from django.contrib import admin
from .models import Session, SessionMetric, RelayPort, HostEarning, HostPenaltyLog


class SessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'gpu', 'renter', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('renter__email', 'gpu__gpu_name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Relationships', {'fields': ('gpu', 'host', 'renter')}),
        ('Status', {'fields': ('status', 'termination_reason')}),
        ('Connection', {'fields': ('relay_server_ip', 'relay_server_port', 'ssh_connection_string')}),
        ('Timing', {'fields': ('start_time', 'active_time', 'end_time', 'duration_hours')}),
        ('Billing', {'fields': ('total_amount', 'actual_cost', 'refund_amount', 'platform_fee')}),
        ('Other', {'fields': ('work_protection_enabled', 'progress_percentage', 'work_lost')}),
    )


class HostEarningAdmin(admin.ModelAdmin):
    list_display = ('id', 'host', 'session', 'amount', 'platform_fee', 'net_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('host__user__email', 'session__id')


class HostPenaltyLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'host', 'penalty_points', 'reason', 'appeal_status', 'created_at')
    list_filter = ('appeal_status', 'created_at')
    search_fields = ('host__user__email', 'reason')


class SessionMetricAdmin(admin.ModelAdmin):
    list_display = ('session', 'gpu_utilization_pct', 'gpu_temperature_c', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('session__id',)


class RelayPortAdmin(admin.ModelAdmin):
    list_display = ('port', 'status', 'leased_to_session_id', 'leased_at')
    list_filter = ('status',)


admin.site.register(Session, SessionAdmin)
admin.site.register(HostEarning, HostEarningAdmin)
admin.site.register(HostPenaltyLog, HostPenaltyLogAdmin)
admin.site.register(SessionMetric, SessionMetricAdmin)
admin.site.register(RelayPort, RelayPortAdmin)