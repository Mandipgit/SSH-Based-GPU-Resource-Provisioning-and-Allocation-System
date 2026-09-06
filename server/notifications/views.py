# notifications/views.py
from rest_framework import generics, status, permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """List all notifications for current user"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="List user notifications",
        description="Retrieve all notifications for the authenticated user, along with unread counters.",
        responses={
            200: inline_serializer(
                name='NotificationListResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'unread_count': serializers.IntegerField(),
                    'count': serializers.IntegerField(),
                    'data': NotificationSerializer(many=True)
                }
            )
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        unread_count = queryset.filter(is_read=False).count()
        
        return Response({
            'status': 'success',
            'unread_count': unread_count,
            'count': queryset.count(),
            'data': serializer.data
        })


class NotificationUnreadCountView(APIView):
    """Get unread notification count"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Get unread notification count",
        description="Returns number of unread alerts for badge display.",
        responses={
            200: inline_serializer(
                name='UnreadCountResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'unread_count': serializers.IntegerField()
                }
            )
        }
    )
    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        
        return Response({
            'status': 'success',
            'unread_count': count
        })


class NotificationMarkReadView(APIView):
    """Mark a notification as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Mark single notification as read",
        description="Updates is_read status to true for a given notification ID.",
        request=None,
        responses={
            200: inline_serializer(
                name='MarkReadResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(default='Notification marked as read')
                }
            )
        }
    )
    def patch(self, request, notification_id):
        notification = get_object_or_404(
            Notification,
            id=notification_id,
            user=request.user
        )
        notification.mark_as_read()
        
        return Response({
            'status': 'success',
            'message': 'Notification marked as read'
        })


class NotificationMarkAllReadView(APIView):
    """Mark all notifications as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Mark all user notifications as read",
        description="Bulk updates all unread notifications to is_read=True.",
        request=None,
        responses={
            200: inline_serializer(
                name='MarkAllReadResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField()
                }
            )
        }
    )
    def post(self, request):
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=False
        )
        count = notifications.count()
        notifications.update(is_read=True, read_at=timezone.now())
        
        return Response({
            'status': 'success',
            'message': f'{count} notifications marked as read'
        })


class NotificationDeleteView(APIView):
    """Delete a notification"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Delete a single notification",
        description="Permanently deletes a notification by ID.",
        request=None,
        responses={
            200: inline_serializer(
                name='DeleteNotificationResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(default='Notification deleted')
                }
            )
        }
    )
    def delete(self, request, notification_id):
        notification = get_object_or_404(
            Notification,
            id=notification_id,
            user=request.user
        )
        notification.delete()
        
        return Response({
            'status': 'success',
            'message': 'Notification deleted'
        })


class NotificationDeleteAllView(APIView):
    """Delete all notifications for user"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Clear all notifications",
        description="Deletes all notifications for the authenticated user.",
        request=None,
        responses={
            200: inline_serializer(
                name='DeleteAllNotificationsResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField()
                }
            )
        }
    )
    def delete(self, request):
        count = Notification.objects.filter(
            user=request.user
        ).count()
        Notification.objects.filter(user=request.user).delete()
        
        return Response({
            'status': 'success',
            'message': f'{count} notifications deleted'
        })