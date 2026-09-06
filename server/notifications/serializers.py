from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = (
            'id', 'user', 'user_email', 'type', 'title',
            'message', 'data', 'is_read', 'read_at',
            'created_at', 'time_ago'
        )
        read_only_fields = ('id', 'user', 'created_at', 'read_at')
    
    @extend_schema_field(serializers.CharField())
    def get_time_ago(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        delta = timezone.now() - obj.created_at
        if delta < timedelta(minutes=1):
            return 'Just now'
        elif delta < timedelta(hours=1):
            return f'{delta.seconds // 60} minutes ago'
        elif delta < timedelta(days=1):
            return f'{delta.seconds // 3600} hours ago'
        elif delta < timedelta(days=7):
            return f'{delta.days} days ago'
        else:
            return obj.created_at.strftime('%b %d, %Y')