from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

# Create your models here.
class Wallet(models.Model):
    """User wallet for storing balance"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE,
        related_name='wallet'
    )
    
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    hold_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    CURRENCY_CHOICES = [
        ('NPR', 'Nepalese Rupee'),
        ('USD', 'US Dollar'),        
    ]
    
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='NPR')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'wallets'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.email} - {self.balance} {self.currency}" 
    
    @property
    def available_balance(self):
        """Balance available for new rentals"""
        from decimal import Decimal
        return Decimal(str(self.balance)) - Decimal(str(self.hold_amount))
    
    def add_funds(self, amount):
        """Add funds to wallet"""
        from decimal import Decimal
        amount_dec = Decimal(str(amount))
        if amount_dec <= 0:
            raise ValueError("Amount must be positive")
        
        self.balance = Decimal(str(self.balance)) + amount_dec
        self.save()
        
        return self.balance
    
    def deduct_funds(self, amount):
        """Deduct funds from wallet"""
        from decimal import Decimal
        amount_dec = Decimal(str(amount))
        if amount_dec <= 0:
            raise ValueError("Amount must be positive")
        
        if amount_dec > self.available_balance:
            raise ValueError("Insufficient balance")
        
        self.balance = Decimal(str(self.balance)) - amount_dec
        self.save()
        return self.balance
    
    def hold_funds(self, amount):
        """Hold funds for a rental"""
        from decimal import Decimal
        amount_dec = Decimal(str(amount))
        if amount_dec <= 0:
            raise ValueError("Amount must be positive")
        if amount_dec > self.available_balance:
            raise ValueError("Insufficient balance")
        self.hold_amount = Decimal(str(self.hold_amount)) + amount_dec
        self.save()
        return self.hold_amount
    
    def release_hold(self, amount):
        """Release held funds"""
        from decimal import Decimal
        amount_dec = Decimal(str(amount))
        if amount_dec <= 0:
            raise ValueError("Amount must be positive")
        if amount_dec > Decimal(str(self.hold_amount)):
            raise ValueError("Hold amount exceeds available hold")
        self.hold_amount = Decimal(str(self.hold_amount)) - amount_dec
        self.save()
        return self.hold_amount
    
    
class Transaction(models.Model):
    """Transaction history for all wallet operations"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('rental_payment', 'Rental Payment'),
        ('host_earning', 'Host Earning'),
        ('refund', 'Refund'),
        ('compensation', 'Compensation'),
        ('platform_fee', 'Platform Fee'),
        ('hold', 'Hold'),
        ('release_hold', 'Release Hold'),
    ]
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    
    # Reference to session (if applicable)
    session_id = models.UUIDField(blank=True, null=True)
    
    # External reference (payment gateway, invoice, etc.)
    reference_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['type', 'status']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"{self.type} - {self.user.email} - {self.amount}"
    
    def complete(self):
        """Mark transaction as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    def fail(self, reason=None):
        """Mark transaction as failed"""
        self.status = 'failed'
        if reason:
            self.description = f"{self.description} - Failed: {reason}"
        self.save()
    
    @classmethod
    def create_deposit(cls, user, amount, reference_id=None, metadata=None):
        """Create a deposit transaction"""
        return cls.objects.create(
            user=user,
            type='deposit',
            amount=amount,
            status='pending',
            reference_id=reference_id,
            metadata=metadata or {},
            description=f"Deposit of {amount}"
        )
    
    @classmethod
    def create_withdrawal(cls, user, amount, reference_id=None, metadata=None):
        """Create a withdrawal transaction"""
        return cls.objects.create(
            user=user,
            type='withdrawal',
            amount=-amount,
            status='pending',
            reference_id=reference_id,
            metadata=metadata or {},
            description=f"Withdrawal of {amount}"
        )
    
    @classmethod
    def create_rental_payment(cls, user, amount, session_id, description=None):
        """Create a rental payment transaction"""
        return cls.objects.create(
            user=user,
            type='rental_payment',
            amount=-amount,
            status='completed',
            session_id=session_id,
            description=description or f"Rental payment for session {session_id}"
        )
    
    @classmethod
    def create_refund(cls, user, amount, session_id, reason=None):
        """Create a refund transaction"""
        return cls.objects.create(
            user=user,
            type='refund',
            amount=amount,
            status='completed',
            session_id=session_id,
            description=f"Refund for session {session_id}: {reason}" if reason else f"Refund for session {session_id}"
        )
    
    @classmethod
    def create_compensation(cls, user, amount, session_id, reason=None):
        """Create a compensation transaction"""
        return cls.objects.create(
            user=user,
            type='compensation',
            amount=amount,
            status='completed',
            session_id=session_id,
            description=f"Compensation for session {session_id}: {reason}" if reason else f"Compensation for session {session_id}"
        )
