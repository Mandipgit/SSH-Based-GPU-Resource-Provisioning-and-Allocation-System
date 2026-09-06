from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import GPU


@receiver(post_save, sender=GPU)
def gpu_updated(sender, instance, created, **kwargs):
    """Log when GPU is created or updated"""
    if created:
        print(f"[INFO] New GPU registered: {instance.gpu_name}")
    else:
        print(f"[UPDATE] GPU updated: {instance.gpu_name}")


@receiver(post_delete, sender=GPU)
def gpu_deleted(sender, instance, **kwargs):
    """Log when GPU is deleted"""
    print(f"[DELETE] GPU removed: {instance.gpu_name}")