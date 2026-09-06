from rest_framework import serializers
from .models import Session, SessionMetric, RelayPort, HostEarning, HostPenaltyLog


class SessionSerializer(serializers.ModelSerializer):
    gpu_name = serializers.CharField(source='gpu.gpu_name', read_only=True)
    host_name = serializers.CharField(source='host.user.email', read_only=True)
    renter_name = serializers.CharField(source='renter.email', read_only=True)
    duration_hours = serializers.FloatField(read_only=True)
    cost_so_far = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Session
        fields = (
            'id', 'gpu', 'gpu_name', 'host', 'host_name',
            'renter', 'renter_name',
            'status', 'relay_server_ip', 'relay_server_port',
            'ssh_connection_string',
            'start_time', 'active_time', 'end_time', 'duration_hours',
            'total_amount', 'actual_cost', 'refund_amount',
            'compensation_amount', 'platform_fee',
            'work_protection_enabled', 'progress_percentage', 'work_lost',
            'termination_reason', 'error_message',
            'last_heartbeat', 'heartbeat_count',
            'created_at', 'updated_at', 'cost_so_far'
        )
        read_only_fields = (
            'id', 'status', 'relay_server_ip', 'relay_server_port',
            'ssh_connection_string', 'start_time', 'active_time',
            'end_time', 'duration_hours', 'total_amount',
            'actual_cost', 'refund_amount', 'compensation_amount',
            'platform_fee', 'work_protection_enabled',
            'progress_percentage', 'work_lost', 'termination_reason',
            'error_message', 'last_heartbeat', 'heartbeat_count',
            'created_at', 'updated_at', 'cost_so_far'
        )


class CreateSessionSerializer(serializers.Serializer):
    gpu_id = serializers.UUIDField(required=True)
    duration_hours = serializers.IntegerField(required=True, min_value=1, max_value=24)
    work_protection = serializers.BooleanField(default=False)


class SessionStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField(required=True)
    error_message = serializers.CharField(required=False, allow_blank=True)
    ssh_connection_string = serializers.CharField(required=False, allow_blank=True)
    relay_server_ip = serializers.CharField(required=False, allow_blank=True)
    relay_server_port = serializers.IntegerField(required=False)

    def validate_status(self, value):
        val = value.strip().upper()
        allowed = ['PENDING', 'STARTING', 'CONTAINER_RUNNING', 'TUNNEL_CONNECTING', 'ACTIVE', 'STOPPING', 'COMPLETED', 'TERMINATED', 'FAILED']
        if val not in allowed:
            raise serializers.ValidationError(f"Invalid status '{value}'. Allowed: {allowed}")
        return val


class SessionHeartbeatSerializer(serializers.Serializer):
    gpu_temperature_c = serializers.FloatField(required=False)
    gpu_utilization_pct = serializers.FloatField(required=False)
    memory_used_mib = serializers.FloatField(required=False)


class SessionMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionMetric
        fields = '__all__'
        read_only_fields = ('id', 'session', 'timestamp')


class RelayPortSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelayPort
        fields = '__all__'


class HostEarningSerializer(serializers.ModelSerializer):
    gpu_name = serializers.CharField(source='session.gpu.gpu_name', read_only=True)
    session_id = serializers.CharField(source='session.id', read_only=True)
    duration_hours = serializers.FloatField(source='session.duration_hours', read_only=True)
    completed_at = serializers.DateTimeField(source='session.end_time', read_only=True)
    
    class Meta:
        model = HostEarning
        fields = (
            'id', 'session_id', 'gpu_name', 'amount', 'platform_fee',
            'net_amount', 'status', 'duration_hours', 'created_at',
            'paid_at', 'completed_at'
        )
        read_only_fields = fields


class HostPenaltyLogSerializer(serializers.ModelSerializer):
    session_id = serializers.CharField(source='session.id', read_only=True, allow_null=True)
    
    class Meta:
        model = HostPenaltyLog
        fields = (
            'id', 'session_id', 'penalty_points', 'reason',
            'appeal_status', 'appeal_reason', 'appealed_at', 'created_at'
        )
        read_only_fields = ('id', 'session_id', 'penalty_points', 'reason', 'created_at')


class HostPenaltyAppealSerializer(serializers.Serializer):
    appeal_reason = serializers.CharField(required=True, min_length=10, max_length=1000)


class HostSettingsSerializer(serializers.Serializer):
    auto_accept = serializers.BooleanField(required=False)
    max_rental_hours = serializers.IntegerField(required=False, min_value=1, max_value=720)
    notification_preferences = serializers.DictField(required=False)
    availability_schedule = serializers.DictField(required=False)


class HostAutoAcceptSerializer(serializers.Serializer):
    auto_accept = serializers.BooleanField(required=True)