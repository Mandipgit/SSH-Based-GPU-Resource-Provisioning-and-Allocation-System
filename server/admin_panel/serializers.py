from django.db import models
from rest_framework import serializers
from users.models import User, HostProfile
from wallets.models import Wallet, Transaction
from sessions.models import Session
from gpus.models import GPU
from reviews.models import Review
from notifications.models import Notification
from .models import SystemSetting, SystemLog


class AdminUserSerializer(serializers.ModelSerializer):
    """User serializer for admin"""
    wallet_balance = serializers.SerializerMethodField()
    total_sessions = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    is_host = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_email_verified', 'is_staff', 'is_superuser',
            'created_at', 'last_login',
            'wallet_balance', 'total_sessions', 'total_spent',
            'is_host'
        )
    
    def get_wallet_balance(self, obj):
        try:
            return float(obj.wallet.balance) if hasattr(obj, 'wallet') else 0.0
        except Exception:
            return 0.0
    
    def get_total_sessions(self, obj):
        return obj.rental_sessions.filter(status__in=['completed', 'terminated']).count()
    
    def get_total_spent(self, obj):
        total = obj.rental_sessions.filter(
            status__in=['completed', 'terminated']
        ).aggregate(total=models.Sum('total_amount'))['total']
        return float(total or 0.0)


class AdminHostSerializer(serializers.ModelSerializer):
    """Host serializer for admin"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    total_gpus = serializers.SerializerMethodField()
    active_gpus = serializers.SerializerMethodField()
    active_sessions = serializers.SerializerMethodField()
    
    class Meta:
        model = HostProfile
        fields = (
            'id', 'user', 'user_email', 'user_name',
            'gpu_name', 'vram_total', 'status',
            'uptime_percentage', 'reliability_score',
            'total_sessions', 'penalty_points', 'total_earnings', 'pending_payout',
            'total_gpus', 'active_gpus', 'active_sessions',
            'created_at', 'updated_at'
        )

    def get_total_gpus(self, obj):
        return obj.gpus.count()

    def get_active_gpus(self, obj):
        return obj.gpus.filter(is_available=True, current_session_id__isnull=True).count()

    def get_active_sessions(self, obj):
        return obj.sessions.filter(status='active').count()


class AdminSessionSerializer(serializers.ModelSerializer):
    """Session serializer for admin"""
    renter_email = serializers.EmailField(source='renter.email', read_only=True)
    host_email = serializers.EmailField(source='host.user.email', read_only=True)
    gpu_name = serializers.CharField(source='gpu.gpu_name', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Session
        fields = (
            'id', 'renter', 'renter_email', 'host', 'host_email',
            'gpu', 'gpu_name', 'status', 'duration',
            'start_time', 'active_time', 'end_time',
            'total_amount', 'actual_cost', 'refund_amount', 'platform_fee',
            'termination_reason', 'error_message',
            'created_at', 'updated_at'
        )
    
    def get_duration(self, obj):
        if obj.active_time and obj.end_time:
            return (obj.end_time - obj.active_time).total_seconds() / 3600
        return 0.0


class AdminTransactionSerializer(serializers.ModelSerializer):
    """Transaction serializer for admin"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Transaction
        fields = (
            'id', 'user', 'user_email', 'type', 'status',
            'amount', 'description', 'session_id',
            'reference_id', 'created_at', 'completed_at'
        )


class AdminGPUSerializer(serializers.ModelSerializer):
    """GPU serializer for admin"""
    host_email = serializers.EmailField(source='host.user.email', read_only=True)
    
    class Meta:
        model = GPU
        fields = (
            'id', 'host', 'host_email', 'gpu_name',
            'vram_gb', 'price_per_hour', 'is_available',
            'total_rental_hours', 'total_earnings', 'total_sessions',
            'created_at', 'updated_at'
        )


class AdminReviewSerializer(serializers.ModelSerializer):
    """Review serializer for admin"""
    renter_email = serializers.EmailField(source='renter.email', read_only=True)
    host_email = serializers.EmailField(source='host.user.email', read_only=True)
    gpu_name = serializers.CharField(source='gpu.gpu_name', read_only=True)
    
    class Meta:
        model = Review
        fields = (
            'id', 'renter', 'renter_email', 'host', 'host_email',
            'gpu', 'gpu_name', 'rating', 'communication_rating',
            'reliability_rating', 'gpu_performance_rating',
            'comment', 'is_verified', 'host_response',
            'created_at', 'updated_at'
        )


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ('id', 'key', 'value', 'description', 'is_public', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class SystemLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemLog
        fields = ('id', 'level', 'source', 'message', 'details', 'created_at')
        read_only_fields = ('id', 'created_at')


class AdminDashboardSerializer(serializers.Serializer):
    """Admin dashboard summary serializer"""
    total_users = serializers.IntegerField()
    total_hosts = serializers.IntegerField()
    total_gpus = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    platform_fees = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_sessions = serializers.IntegerField()
    pending_withdrawals = serializers.IntegerField()
    recent_activity = serializers.ListField()