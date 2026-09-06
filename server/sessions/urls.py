from django.urls import path
from . import views
from . import host_views

app_name = 'sessions'

urlpatterns = [
    # Renter endpoints
    path('', views.SessionListView.as_view(), name='session-list'),
    path('create/', views.CreateSessionView.as_view(), name='session-create'),
    path('<uuid:session_id>/', views.SessionDetailView.as_view(), name='session-detail'),
    path('<uuid:session_id>/status/', views.SessionStatusView.as_view(), name='session-status'),  
    path('<uuid:session_id>/stop/', views.StopSessionView.as_view(), name='session-stop'),
    
    # Host endpoints
    path('host/pending/', views.HostPendingSessionsView.as_view(), name='host-pending'),
    path('host/dashboard/', host_views.HostDashboardView.as_view(), name='host-dashboard'),
    path('host/earnings/', host_views.HostEarningsView.as_view(), name='host-earnings'),
    path('host/earnings/summary/', host_views.HostEarningsSummaryView.as_view(), name='host-earnings-summary'),
    path('host/penalties/', host_views.HostPenaltiesView.as_view(), name='host-penalties'),
    path('host/penalties/<uuid:penalty_id>/appeal/', host_views.HostPenaltyAppealView.as_view(), name='host-penalty-appeal'),
    path('host/settings/', host_views.HostSettingsView.as_view(), name='host-settings'),
    path('host/auto-accept/', host_views.HostAutoAcceptToggleView.as_view(), name='host-auto-accept'),
    path('host/activity/', host_views.HostActivityView.as_view(), name='host-activity'),
    path('<uuid:session_id>/status-update/', views.HostSessionStatusUpdateView.as_view(), name='session-status-update'),
    path('<uuid:session_id>/heartbeat/', views.HostSessionHeartbeatView.as_view(), name='session-heartbeat'),
    path('<uuid:session_id>/commands/', views.HostSessionCommandsView.as_view(), name='session-commands'),
]