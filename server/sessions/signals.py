# sessions/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Session


@receiver(post_save, sender=Session)
def session_updated(sender, instance, created, **kwargs):
    if created:
        print(f"New session created: {instance.id}")
    else:
        print(f"Session updated: {instance.id} - {instance.status}")


@receiver(post_delete, sender=Session)
def session_deleted(sender, instance, **kwargs):
    print(f"Session removed: {instance.id}")