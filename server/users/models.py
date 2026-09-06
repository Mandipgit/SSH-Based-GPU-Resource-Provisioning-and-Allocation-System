from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid
import secrets


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for authentication.
    Handles BOTH clients (renters) and hosts.
    Role field determines access level.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # ===== CORE FIELDS =====
    email = models.EmailField(unique=True, max_length=255, db_index=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    
    # ===== ROLE =====
    ROLE_CHOICES = [
        ('renter', 'Renter'),
        ('host', 'Host'),
        ('both', 'Both'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='renter')
    
    # ===== API KEY FOR HOST AGENT =====
    host_api_key = models.CharField(max_length=255, unique=True, blank=True, null=True)
    
    # ===== STATUS FLAGS =====
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    
    # ===== TIMESTAMPS =====
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    # ===== EXTERNAL INTEGRATION =====
    supabase_user_id = models.CharField(max_length=255, blank=True, null=True)
    
    # ===== FIX: Add related_name to avoid clashes =====
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='users_user_set',  # ← CUSTOM related_name
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='users_user_permissions_set',  # ← CUSTOM related_name
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def is_renter(self):
        return self.role in ['renter', 'both']
    
    @property
    def is_host(self):
        return self.role in ['host', 'both']
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    def generate_host_api_key(self):
        """Generate a secure API key for host agent"""
        self.host_api_key = f"host_{secrets.token_urlsafe(32)}"
        self.save()
        return self.host_api_key
    
    def get_host_profile(self):
        """Get host profile if exists"""
        return getattr(self, 'host_profile', None)

class HostProfile(models.Model):
    """
    Extended profile for hosts.
    Only created when user.role is 'host' or 'both'.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='host_profile'
    )
    
    # ===== GPU INFORMATION =====
    gpu_name = models.CharField(max_length=255, blank=True, null=True)
    vram_total = models.CharField(max_length=50, blank=True, null=True)
    vram_gb = models.IntegerField(blank=True, null=True)
    driver_version = models.CharField(max_length=50, blank=True, null=True)
    cuda_version = models.CharField(max_length=50, blank=True, null=True)
    os_version = models.CharField(max_length=100, blank=True, null=True)
    
    # ===== HOST STATUS =====
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('restricted', 'Restricted'),
        ('suspended', 'Suspended'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    
    # ===== RELIABILITY METRICS =====
    uptime_percentage = models.FloatField(default=0.0)
    reliability_score = models.IntegerField(default=100)
    total_sessions = models.IntegerField(default=0)
    penalty_points = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    pending_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_rental_hours = models.FloatField(default=0.0)
    
    # ===== HOST PREFERENCES & SETTINGS =====
    auto_accept = models.BooleanField(default=False)
    max_rental_hours = models.IntegerField(default=24)
    notification_preferences = models.JSONField(default=dict, blank=True)
    availability_schedule = models.JSONField(default=dict, blank=True)
    
    # ===== LOCATION & NETWORK =====
    location = models.CharField(max_length=255, blank=True, null=True)
    internet_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        choices=[
            ('home', 'Home'),
            ('datacenter', 'Datacenter'),
            ('mobile', 'Mobile'),
            ('office', 'Office'),
        ]
    )
    
    # ===== HEARTBEAT TRACKING =====
    last_heartbeat = models.DateTimeField(blank=True, null=True)
    offline_since = models.DateTimeField(blank=True, null=True)
    heartbeat_count = models.IntegerField(default=0)
    
    # ===== TIMESTAMPS =====
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Host: {self.user.email} - {self.gpu_name or 'Not Configured'}"
    
    def is_online(self):
        return self.status == 'online'
    
    def mark_online(self):
        self.status = 'online'
        self.offline_since = None
        self.save()
    
    def mark_offline(self):
        self.status = 'offline'
        if not self.offline_since:
            self.offline_since = timezone.now()
        self.save()
    
    def update_heartbeat(self):
        self.last_heartbeat = timezone.now()
        self.heartbeat_count += 1
        self.status = 'online'
        self.save()

    def apply_penalty(self, points, reason, session=None):
        """Apply penalty points, record penalty log, and adjust status/score"""
        from sessions.models import HostPenaltyLog
        self.penalty_points += points
        self.reliability_score = max(0, 100 - (self.penalty_points * 2))
        
        if self.penalty_points >= 100:
            self.status = 'suspended'
        elif self.penalty_points >= 50 and self.status not in ['suspended']:
            self.status = 'restricted'
            
        self.save()
        
        return HostPenaltyLog.objects.create(
            host=self,
            session=session,
            penalty_points=points,
            reason=reason
        )

    def update_earnings(self, net_amount, hours=0.0):
        """Update host earnings and rental stats"""
        from decimal import Decimal
        self.total_earnings = Decimal(str(self.total_earnings or '0.00')) + Decimal(str(net_amount))
        self.total_rental_hours += float(hours)
        self.total_sessions += 1
        self.save()


class PasswordResetToken(models.Model):
    """Store password reset tokens (expire after 24 hours)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reset_tokens'
    )
    token = models.CharField(max_length=255, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def __str__(self):
        return f"Reset token for {self.user.email}"
    
    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()


class EmailVerificationToken(models.Model):
    """Store email verification tokens (expire after 7 days)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='verification_tokens'
    )
    token = models.CharField(max_length=255, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def __str__(self):
        return f"Verification token for {self.user.email}"
    
    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()



class LoginAttempt(models.Model):
    """Track failed login attempts for security"""
    
    email = models.EmailField()
    ip_address = models.GenericIPAddressField()
    attempt_count = models.IntegerField(default=1)
    first_attempt = models.DateTimeField(auto_now_add=True)
    last_attempt = models.DateTimeField(auto_now=True)
    is_locked = models.BooleanField(default=False)
    locked_until = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        unique_together = ['email', 'ip_address']
    
    def __str__(self):
        return f"{self.email} - {self.ip_address} - {self.attempt_count}"
    
    def is_locked_out(self):
        if not self.is_locked or not self.locked_until:
            return False
        return self.locked_until > timezone.now()