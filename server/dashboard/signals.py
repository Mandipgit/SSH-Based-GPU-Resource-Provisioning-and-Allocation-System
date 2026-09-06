from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import post_save
from django.conf import settings

from .models import UserActivityLog, PlatformAnalytics
from .services import ActivityLogger, AnalyticsAggregator
from sessions.models import Session
from wallets.models import Transaction
from reviews.models import Review
from users.models import User


@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    """Log user login activity"""
    try:
        ActivityLogger.log(
            user=user,
            action='user_login',
            details={'email': user.email, 'role': user.role},
            request=request
        )
    except Exception:
        pass


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def on_user_created(sender, instance, created, **kwargs):
    """Log user registration and update platform analytics"""
    if created:
        try:
            ActivityLogger.log(
                user=instance,
                action='user_register',
                details={'email': instance.email, 'role': instance.role}
            )
            AnalyticsAggregator.aggregate_daily_analytics()
        except Exception:
            pass


@receiver(post_save, sender=Session)
def on_session_saved(sender, instance, created, **kwargs):
    """Log session creation / status change and update analytics"""
    try:
        if created:
            ActivityLogger.log(
                user=instance.renter,
                action='session_created',
                details={
                    'session_id': str(instance.id),
                    'gpu_name': instance.gpu.gpu_name if instance.gpu else 'GPU',
                    'host_email': instance.host.user.email if instance.host else 'Host',
                    'status': instance.status,
                    'total_amount': float(instance.total_amount or 0.0),
                }
            )
            AnalyticsAggregator.aggregate_daily_analytics()
        else:
            if instance.status in ['completed', 'terminated']:
                ActivityLogger.log(
                    user=instance.renter,
                    action=f'session_{instance.status}',
                    details={
                        'session_id': str(instance.id),
                        'gpu_name': instance.gpu.gpu_name if instance.gpu else 'GPU',
                        'duration_hours': instance.duration_hours or 0.0,
                        'actual_cost': float(instance.actual_cost or instance.total_amount or 0.0),
                        'termination_reason': instance.termination_reason or '',
                    }
                )
                AnalyticsAggregator.aggregate_daily_analytics()
    except Exception:
        pass


@receiver(post_save, sender=Transaction)
def on_transaction_saved(sender, instance, created, **kwargs):
    """Log wallet transaction activity (deposit, payment, withdrawal)"""
    try:
        if instance.status == 'completed':
            action_name = instance.type
            ActivityLogger.log(
                user=instance.user,
                action=action_name,
                details={
                    'transaction_id': str(instance.id),
                    'type': instance.type,
                    'amount': float(instance.amount),
                    'description': instance.description or '',
                }
            )
            AnalyticsAggregator.aggregate_daily_analytics()
    except Exception:
        pass


@receiver(post_save, sender=Review)
def on_review_created(sender, instance, created, **kwargs):
    """Log review creation"""
    if created:
        try:
            ActivityLogger.log(
                user=instance.renter,
                action='review_created',
                details={
                    'review_id': str(instance.id),
                    'rating': instance.rating,
                    'host_email': instance.host.user.email if instance.host else 'Host',
                }
            )
        except Exception:
            pass
