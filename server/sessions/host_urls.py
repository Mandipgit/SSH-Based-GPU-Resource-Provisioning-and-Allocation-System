from django.urls import path
from . import host_views

app_name = 'host'

urlpatterns = [
    # Dashboard & Analytics
    path('dashboard/', host_views.HostDashboardView.as_view(), name='dashboard'),
    path('activity/', host_views.HostActivityView.as_view(), name='activity'),
    
    # Earnings & Payouts
    path('earnings/', host_views.HostEarningsView.as_view(), name='earnings'),
    path('earnings/summary/', host_views.HostEarningsSummaryView.as_view(), name='earnings-summary'),
    
    # Penalties & Appeals
    path('penalties/', host_views.HostPenaltiesView.as_view(), name='penalties'),
    path('penalties/<uuid:penalty_id>/appeal/', host_views.HostPenaltyAppealView.as_view(), name='penalty-appeal'),
    
    # Settings & Preferences
    path('settings/', host_views.HostSettingsView.as_view(), name='settings'),
    path('auto-accept/', host_views.HostAutoAcceptToggleView.as_view(), name='auto-accept'),
]
