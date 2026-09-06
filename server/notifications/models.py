from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class Notification(models.Model):
    """User notifications"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    NOTIFICATION_TYPES = [
        ('session_started', 'Session Started'),
        ('session_ending', 'Session Ending Soon'),
        ('session_completed', 'Session Completed'),
        ('session_terminated', 'Session Terminated'),
        ('refund_processed', 'Refund Processed'),
        ('payment_received', 'Payment Received'),
        ('host_offline', 'Host Offline'),
        ('new_session_request', 'New Session Request'),
        ('wallet_credited', 'Wallet Credited'),
        ('wallet_debited', 'Wallet Debited'),
        ('welcome', 'Welcome'),
        ('system_alert', 'System Alert'),
        ('penalty_applied', 'Penalty Applied'),
        ('review_received', 'Review Received'),
        ('review_response', 'Host Responded to Review'),
    ]
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.type} - {self.user.email}"
    
    def mark_as_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save()