from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from decimal import Decimal
class GPU(models.Model):
    """GPU resource offered by a host"""
    
    id = models.UUIDField(primary_key=True,default= uuid.uuid4, editable=True)
    
    host = models.ForeignKey(
        'users.HostProfile',
        on_delete=models.CASCADE,
        related_name='gpus'
    )
    
    gpu_name = models.CharField(max_length=255, help_text="e.g., NVIDIA RTX 4090")
    vram_total = models.CharField(max_length=50, help_text="e.g., 24576 MiB")
    vram_gb = models.IntegerField(help_text="VRAM in GB, e.g., 24")
    
    # Optional specs
    cuda_cores = models.IntegerField(blank=True, null= True)
    memory_bandwidth = models.CharField(max_length=50, blank=True, null=True)
    compute_capability = models.CharField(max_length=10, blank=True, null=True)
    driver_version = models.CharField(max_length=50, blank=True, null=True)
    cuda_version = models.CharField(max_length=50, blank=True, null=True)
    
    #  PRICING 
    price_per_hour = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Price in NPR per hour"
    )
    
    # AVAILABILITY 
    is_available = models.BooleanField(default=True)
    current_session_id = models.UUIDField(blank=True, null=True)
    
    # LOCATION 
    location = models.CharField(max_length=255, blank=True, null=True)
    
    # STATISTICS 
    total_rental_hours = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    total_earnings = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    total_sessions = models.IntegerField(default=0)
    
    #TIMESTAMPS
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'gpus'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['host', '-created_at']),
            models.Index(fields=['is_available']),
            models.Index(fields=['vram_gb']),
            models.Index(fields=['price_per_hour']),
            models.Index(fields=['location']),
        ]
    
    def __str__(self):
        return f"{self.gpu_name} - {self.host.user.email}"
    
    @property
    def is_rentable(self):
        """Check if GPU can be rented"""
        return (
            self.is_available and
            self.current_session_id is None and 
            self.host. status == 'online'
        )
    
    def mark_rented(self, session_id):
        """Mark GPU as rented"""
        self.is_available = False
        self.current_session_id = session_id
        self.save()
    
    def mark_available(self):
        """Mark GPU as available"""
        self.is_available = True
        self.current_session_id = None
        self.save()
    
    def update_stats(self, hours, earnings):
        """Update GPU statistics after a session"""
        from decimal import Decimal
        self.total_rental_hours = Decimal(str(self.total_rental_hours or '0.00')) + Decimal(str(hours))
        self.total_earnings = Decimal(str(self.total_earnings or '0.00')) + Decimal(str(earnings))
        self.total_sessions += 1
        self.save()

