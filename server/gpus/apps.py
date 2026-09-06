from django.apps import AppConfig


class GpusConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gpus'
    
    def ready(self):
        import gpus.signals
