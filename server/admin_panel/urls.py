from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    # Dashboard
    path('dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    
    # Users
    path('users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('users/<uuid:id>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    
    # Hosts
    path('hosts/', views.AdminHostListView.as_view(), name='admin-hosts'),
    path('hosts/<uuid:id>/', views.AdminHostDetailView.as_view(), name='admin-host-detail'),
    
    # Sessions
    path('sessions/', views.AdminSessionListView.as_view(), name='admin-sessions'),
    path('sessions/<uuid:id>/', views.AdminSessionDetailView.as_view(), name='admin-session-detail'),
    
    # Transactions
    path('transactions/', views.AdminTransactionListView.as_view(), name='admin-transactions'),
    path('transactions/<uuid:id>/', views.AdminTransactionDetailView.as_view(), name='admin-transaction-detail'),
    path('transactions/<uuid:id>/refund/', views.AdminTransactionRefundView.as_view(), name='admin-transaction-refund'),
    
    # GPUs
    path('gpus/', views.AdminGPUListView.as_view(), name='admin-gpus'),
    path('gpus/<uuid:id>/', views.AdminGPUDetailView.as_view(), name='admin-gpu-detail'),
    
    # Reviews
    path('reviews/', views.AdminReviewListView.as_view(), name='admin-reviews'),
    path('reviews/<uuid:id>/moderate/', views.AdminReviewModerateView.as_view(), name='admin-review-moderate'),
    
    # Settings
    path('settings/', views.SystemSettingListView.as_view(), name='admin-settings'),
    path('settings/<str:key>/', views.SystemSettingDetailView.as_view(), name='admin-setting-detail'),
    
    # Logs
    path('logs/', views.SystemLogListView.as_view(), name='admin-logs'),
    path('logs/clear/', views.SystemLogClearView.as_view(), name='admin-logs-clear'),
]