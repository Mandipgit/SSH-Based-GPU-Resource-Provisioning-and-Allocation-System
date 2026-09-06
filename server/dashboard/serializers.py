from rest_framework import serializers
from .models import DashboardWidget, PlatformAnalytics, UserActivityLog


class DashboardWidgetSerializer(serializers.ModelSerializer):
    """Serializer for DashboardWidget model"""

    class Meta:
        model = DashboardWidget
        fields = (
            'id',
            'widget_type',
            'position',
            'settings',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PlatformAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for PlatformAnalytics model"""

    class Meta:
        model = PlatformAnalytics
        fields = (
            'id',
            'date',
            'total_users',
            'total_hosts',
            'total_gpus',
            'total_sessions',
            'active_sessions',
            'total_revenue',
            'platform_fees',
            'new_users',
            'new_hosts',
            'new_sessions',
            'created_at',
        )
        read_only_fields = fields


class UserActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for UserActivityLog model"""
    user_email = serializers.CharField(source='user.email', read_only=True, default='Anonymous')

    class Meta:
        model = UserActivityLog
        fields = (
            'id',
            'user',
            'user_email',
            'action',
            'details',
            'ip_address',
            'created_at',
        )
        read_only_fields = fields


# ===================================================
# Serializers for API responses / Documentation schema
# ===================================================

class PlatformOverviewSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_hosts = serializers.IntegerField()
    total_gpus = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    platform_fees = serializers.DecimalField(max_digits=12, decimal_places=2)
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    period = serializers.CharField()


class PlatformTimelineItemSerializer(serializers.Serializer):
    date = serializers.CharField()
    total_users = serializers.IntegerField()
    total_hosts = serializers.IntegerField()
    total_gpus = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    platform_fees = serializers.FloatField()
    new_users = serializers.IntegerField()
    new_hosts = serializers.IntegerField()
    new_sessions = serializers.IntegerField()


class PlatformAnalyticsResponseSerializer(serializers.Serializer):
    overview = PlatformOverviewSerializer()
    timeline = PlatformTimelineItemSerializer(many=True)


class RevenueSummarySerializer(serializers.Serializer):
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    period = serializers.CharField()
    gross_revenue = serializers.FloatField()
    platform_fees = serializers.FloatField()
    host_net_earnings = serializers.FloatField()
    total_refunds = serializers.FloatField()
    completed_rentals = serializers.IntegerField()


class RevenueTimelineItemSerializer(serializers.Serializer):
    period = serializers.CharField()
    gross_revenue = serializers.FloatField()
    platform_fees = serializers.FloatField()
    host_net_earnings = serializers.FloatField()
    sessions_count = serializers.IntegerField()


class RevenueAnalyticsResponseSerializer(serializers.Serializer):
    summary = RevenueSummarySerializer()
    timeline = RevenueTimelineItemSerializer(many=True)


class DashboardSummarySerializer(serializers.Serializer):
    """Generic or role-based dashboard summary response serializer"""
    role = serializers.CharField()
