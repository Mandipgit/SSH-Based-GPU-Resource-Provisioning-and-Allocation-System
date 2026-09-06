from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('unread/', views.NotificationUnreadCountView.as_view(), name='unread-count'),
    path('<uuid:notification_id>/read/', views.NotificationMarkReadView.as_view(), name='mark-read'),
    path('read-all/', views.NotificationMarkAllReadView.as_view(), name='mark-all-read'),
    path('<uuid:notification_id>/delete/', views.NotificationDeleteView.as_view(), name='delete'),
    path('delete-all/', views.NotificationDeleteAllView.as_view(), name='delete-all'),
]