from django.db import models
from django.conf import settings
from decimal import Decimal
import uuid


class DashboardWidget(models.Model):
    """User customizable dashboard widgets"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dashboard_widgets'
    )
    
    WIDGET_TYPE_CHOICES = [
        ('sessions', 'Session Overview'),
        ('earnings', 'Earnings & Revenue'),
        ('gpus', 'GPU Inventory'),
        ('reviews', 'Ratings & Reviews'),
        ('wallet', 'Wallet & Balance'),
        ('activity', 'Recent Activity'),
        ('system_metrics', 'System Performance'),
        ('platform_stats', 'Platform Overview'),
    ]
    widget_type = models.CharField(max_length=50, choices=WIDGET_TYPE_CHOICES)
    position = models.IntegerField(default=0)
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dashboard_widgets'
        ordering = ['position', 'created_at']
        indexes = [
            models.Index(fields=['user', 'is_active', 'position']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.widget_type} (pos: {self.position})"


class PlatformAnalytics(models.Model):
    """Daily platform analytics snapshot"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(unique=True, db_index=True)
    
    # Platform counts snapshot
    total_users = models.IntegerField(default=0)
    total_hosts = models.IntegerField(default=0)
    total_gpus = models.IntegerField(default=0)
    total_sessions = models.IntegerField(default=0)
    active_sessions = models.IntegerField(default=0)
    
    # Financials
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    platform_fees = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Daily Deltas
    new_users = models.IntegerField(default=0)
    new_hosts = models.IntegerField(default=0)
    new_sessions = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'platform_analytics'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['-date']),
        ]
    
    def __str__(self):
        return f"Analytics {self.date}: {self.total_users} users, {self.total_sessions} sessions, NPR {self.total_revenue}"


class UserActivityLog(models.Model):
    """Track user activity across platform events"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    
    ACTION_CHOICES = [
        ('user_login', 'User Logged In'),
        ('user_register', 'User Registered'),
        ('session_created', 'Session Created'),
        ('session_started', 'Session Started'),
        ('session_stopped', 'Session Stopped'),
        ('session_completed', 'Session Completed'),
        ('session_terminated', 'Session Terminated'),
        ('deposit', 'Wallet Deposit'),
        ('withdrawal', 'Wallet Withdrawal'),
        ('rental_payment', 'Rental Payment'),
        ('gpu_registered', 'GPU Registered'),
        ('gpu_updated', 'GPU Updated'),
        ('review_created', 'Review Created'),
        ('penalty_applied', 'Penalty Applied'),
    ]
    action = models.CharField(max_length=100, db_index=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'user_activity_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        user_email = self.user.email if self.user else 'System/Anonymous'
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {user_email} - {self.action}"
