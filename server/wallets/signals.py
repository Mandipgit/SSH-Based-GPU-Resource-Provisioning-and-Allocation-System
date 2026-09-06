# wallets/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Wallet


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_wallet(sender, instance, created, **kwargs):
    """Create a wallet for every user if they don't have one"""
    if created:
        Wallet.objects.get_or_create(user=instance)
    else:
        if not hasattr(instance, 'wallet'):
            Wallet.objects.get_or_create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_wallet(sender, instance, **kwargs):
    """Save wallet when user is saved"""
    if hasattr(instance, 'wallet'):
        instance.wallet.save()
