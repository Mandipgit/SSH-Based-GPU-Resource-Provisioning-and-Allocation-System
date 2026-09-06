from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from wallets.models import Wallet, Transaction


class BillingService:
    """Handle session billing"""
    
    @classmethod
    @transaction.atomic
    def hold_funds(cls, session):
        """Hold funds from renter's wallet"""
        wallet = Wallet.objects.select_for_update().get(user=session.renter)
        
        # Convert to Decimal
        amount = Decimal(str(session.total_amount))
        
        if wallet.available_balance < amount:
            raise ValueError(f"Insufficient balance. Available: {wallet.available_balance}")
        
        wallet.hold_amount += amount
        wallet.save()
        
        # Create hold transaction
        Transaction.objects.create(
            user=session.renter,
            type='hold',
            amount=amount,
            status='completed',
            description=f'Hold for session {session.id}',
            session_id=session.id
        )
        
        return wallet
    
    @classmethod
    @transaction.atomic
    def release_hold(cls, session):
        """Release hold when session fails"""
        wallet = Wallet.objects.select_for_update().get(user=session.renter)
        
        amount = Decimal(str(session.total_amount))
        
        wallet.hold_amount -= amount
        wallet.save()
        
        # Create release transaction
        Transaction.objects.create(
            user=session.renter,
            type='release_hold',
            amount=amount,
            status='completed',
            description=f'Release hold for session {session.id}',
            session_id=session.id
        )
        
        return wallet
    
    @classmethod
    @transaction.atomic
    def process_rental_payment(cls, session):
        """Process payment when session ends"""
        wallet = Wallet.objects.select_for_update().get(user=session.renter)
        
        # Convert to Decimal
        amount_hold = Decimal(str(session.total_amount))
        
        # Release hold
        wallet.hold_amount -= amount_hold
        wallet.save()
        
        # Deduct actual cost
        actual_cost = Decimal(str(session.actual_cost))
        refund_amount = amount_hold - actual_cost
        
        # Refund if any
        if refund_amount > 0:
            wallet.balance += refund_amount
            wallet.save()
            
            Transaction.objects.create(
                user=session.renter,
                type='refund',
                amount=refund_amount,
                status='completed',
                description=f'Refund for session {session.id}',
                session_id=session.id
            )
        
        # Pay host (minus platform fee)
        host_wallet = Wallet.objects.get(user=session.host.user)
        platform_fee = actual_cost * Decimal('0.10')  # 10% platform fee
        host_earnings = actual_cost - platform_fee
        
        host_wallet.balance += host_earnings
        host_wallet.save()

        # Update session platform fee
        session.platform_fee = float(platform_fee)
        session.save(update_fields=['platform_fee'])

        # Create HostEarning record
        from sessions.models import HostEarning
        HostEarning.objects.create(
            host=session.host,
            session=session,
            amount=actual_cost,
            platform_fee=platform_fee,
            net_amount=host_earnings,
            status='completed',
            paid_at=timezone.now()
        )

        # Update HostProfile stats
        duration_hours = session.duration_hours or session.get_duration_in_hours()
        session.host.update_earnings(host_earnings, hours=duration_hours)
        
        # Record transactions
        Transaction.objects.create(
            user=session.renter,
            type='rental_payment',
            amount=actual_cost,
            status='completed',
            description=f'Rental payment for session {session.id}',
            session_id=session.id
        )
        
        Transaction.objects.create(
            user=session.host.user,
            type='host_earning',
            amount=host_earnings,
            status='completed',
            description=f'Earnings from session {session.id}',
            session_id=session.id
        )
        
        Transaction.objects.create(
            user=session.host.user,
            type='platform_fee',
            amount=platform_fee,
            status='completed',
            description=f'Platform fee for session {session.id}',
            session_id=session.id
        )
        
        return {
            'actual_cost': float(actual_cost),
            'refund': float(refund_amount),
            'host_earnings': float(host_earnings),
            'platform_fee': float(platform_fee)
        }