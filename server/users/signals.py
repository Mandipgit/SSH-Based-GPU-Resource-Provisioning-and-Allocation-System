from django.dispatch import receiver
from django.db.models.signals import post_save
from .models import User,HostProfile

@receiver(post_save, sender=User)
def create_host_profile(sender, instance,created, **kwargs):
    if created and instance.role in ['host','both']:
        HostProfile.objects.get_or_create(user=instance)
        
           
@receiver(post_save,sender=User)
def save_host_profile(sender, instance, **kwargs):
    if instance.role in ['host', 'both']:
        HostProfile.objects.get_or_create(user = instance)