from django.db import models
from django.conf import settings
import uuid


class SystemSetting(models.Model):
    """Platform system settings"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_settings'
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key} = {self.value}"


class SystemLog(models.Model):
    """System logs for admin monitoring"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    LOG_LEVELS = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    level = models.CharField(max_length=20, choices=LOG_LEVELS, default='info')
    
    source = models.CharField(max_length=100)
    message = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['level']),
            models.Index(fields=['source']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"[{self.level}] {self.source}: {self.message[:50]}"