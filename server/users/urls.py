# users/urls.py
from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('refresh/', views.RefreshTokenView.as_view(), name='refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    
    # Password Management
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
    
    # Host API Key
    path('host/api-key/', views.GenerateHostApiKeyView.as_view(), name='host-api-key'),
    path('host/api-key/validate/', views.ValidateHostApiKeyView.as_view(), name='validate-api-key'),
    
    # Host Profile
    path('host/profile/', views.HostProfileView.as_view(), name='host-profile'),
    
    # Host Status
    path('host/heartbeat/', views.HostHeartbeatView.as_view(), name='host-heartbeat'),
    path('host/status/', views.HostStatusView.as_view(), name='host-status'),
    
    # Admin
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<uuid:user_id>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
]