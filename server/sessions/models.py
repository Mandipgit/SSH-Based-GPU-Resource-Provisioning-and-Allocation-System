from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class Session(models.Model):
    """GPU rental session"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    gpu = models.ForeignKey('gpus.GPU', on_delete=models.CASCADE, related_name='sessions')
    host = models.ForeignKey('users.HostProfile', on_delete=models.CASCADE, related_name='sessions')
    renter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rental_sessions')
    
    # Session Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('starting', 'Starting'),
        ('container_running', 'Container Running'),
        ('tunnel_connecting', 'Tunnel Connecting'),
        ('active', 'Active'),
        ('stopping', 'Stopping'),
        ('completed', 'Completed'),
        ('terminated', 'Terminated'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    
    # Relay Server Info
    relay_server_ip = models.CharField(max_length=255, blank=True, null=True)
    relay_server_port = models.IntegerField(blank=True, null=True)
    relay_auth_key = models.TextField(blank=True, null=True)
    ssh_connection_string = models.TextField(blank=True, null=True)
    
    # Session Timing
    start_time = models.DateTimeField(auto_now_add=True)
    active_time = models.DateTimeField(blank=True, null=True)  # When session became ACTIVE
    end_time = models.DateTimeField(blank=True, null=True)
    duration_hours = models.FloatField(blank=True, null=True)
    
    # Billing
    total_amount = models.FloatField(default=0.0)
    actual_cost = models.FloatField(blank=True, null=True)
    refund_amount = models.FloatField(default=0.0)
    compensation_amount = models.FloatField(default=0.0)
    platform_fee = models.FloatField(default=0.0)
    
    # Work Protection
    work_protection_enabled = models.BooleanField(default=False)
    work_protection_fee = models.FloatField(default=0.0)
    
    # Progress Tracking
    progress_percentage = models.FloatField(default=0.0)
    work_lost = models.BooleanField(default=False)
    
    # Termination
    TERMINATION_REASONS = [
        ('host_offline', 'Host Offline'),
        ('renter_stopped', 'Renter Stopped'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('host_rejected', 'Host Rejected'),
        ('idle_timeout', 'Idle Timeout'),
        ('admin_cancelled', 'Admin Cancelled'),
    ]
    termination_reason = models.CharField(max_length=20, choices=TERMINATION_REASONS, blank=True, null=True)
    
    # Error Tracking
    error_message = models.TextField(blank=True, null=True)
    
    # Heartbeat Tracking
    last_heartbeat = models.DateTimeField(blank=True, null=True)
    heartbeat_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['host', 'status']),
            models.Index(fields=['renter', 'status']),
            models.Index(fields=['gpu', '-created_at']),
        ]
    
    def __str__(self):
        return f"Session {self.id} - {self.status}"
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @property
    def is_completed(self):
        return self.status in ['completed', 'terminated']
        
    @property
    def relay_port_obj(self):
        """Get the leased relay port for this session"""
        return RelayPort.objects.filter(leased_to_session_id=self.id).first()
    
    def get_duration_in_hours(self):
        """Calculate session duration in hours"""
        if self.active_time and self.end_time:
            return (self.end_time - self.active_time).total_seconds() / 3600
        elif self.active_time:
            return (timezone.now() - self.active_time).total_seconds() / 3600
        return 0
    
    def get_cost_so_far(self):
        """Calculate cost so far"""
        hours = self.get_duration_in_hours()
        return hours * float(self.gpu.price_per_hour)


class SessionMetric(models.Model):
    """Real-time metrics for active sessions"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='metrics')
    
    # GPU Metrics
    gpu_temperature_c = models.FloatField(blank=True, null=True)
    gpu_utilization_pct = models.FloatField(blank=True, null=True)
    memory_used_mib = models.FloatField(blank=True, null=True)
    memory_total_mib = models.FloatField(blank=True, null=True)
    power_usage_w = models.FloatField(blank=True, null=True)
    fan_speed_pct = models.FloatField(blank=True, null=True)
    
    # System Metrics
    cpu_usage_pct = models.FloatField(blank=True, null=True)
    ram_usage_mb = models.FloatField(blank=True, null=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'session_metrics'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Metrics - Session {self.session.id} at {self.timestamp}"


class RelayPort(models.Model):
    """Manages SSH relay ports for sessions"""
    
    id = models.AutoField(primary_key=True)
    port = models.IntegerField(unique=True)
    
    STATUS_CHOICES = [
        ('free', 'Free'),
        ('leased', 'Leased'),
        ('reserved', 'Reserved'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='free')
    
    leased_to_session_id = models.UUIDField(blank=True, null=True)
    leased_at = models.DateTimeField(blank=True, null=True)
    released_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'relay_ports'
    
    def __str__(self):
        return f"Port {self.port} - {self.status}"
    
    def lease(self, session_id):
        """Lease this port to a session"""
        self.status = 'leased'
        self.leased_to_session_id = session_id
        self.leased_at = timezone.now()
        self.save()
    
    def release(self):
        """Release this port"""
        self.status = 'free'
        self.leased_to_session_id = None
        self.released_at = timezone.now()
        self.save()


class HostEarning(models.Model):
    """Track host earnings per session"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey('users.HostProfile', on_delete=models.CASCADE, related_name='earnings')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='host_earnings')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('withdrawn', 'Withdrawn'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'host_earnings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['host', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Earning {self.id} - Host {self.host.user.email} - {self.net_amount}"


class HostPenaltyLog(models.Model):
    """Track host penalties and appeals"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey('users.HostProfile', on_delete=models.CASCADE, related_name='penalties')
    session = models.ForeignKey(Session, on_delete=models.SET_NULL, null=True, blank=True, related_name='penalties')
    penalty_points = models.IntegerField()
    reason = models.TextField()
    
    APPEAL_STATUS_CHOICES = [
        ('none', 'None'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    appeal_status = models.CharField(max_length=20, choices=APPEAL_STATUS_CHOICES, default='none')
    appeal_reason = models.TextField(blank=True, null=True)
    appealed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'host_penalties'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['host', '-created_at']),
        ]
    
    def __str__(self):
        return f"Penalty {self.penalty_points} pts - Host {self.host.user.email}"