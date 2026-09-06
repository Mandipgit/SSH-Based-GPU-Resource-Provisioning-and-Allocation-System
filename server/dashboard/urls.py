from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Dashboard summaries & roles
    path('summary/', views.DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('host/', views.HostDashboardView.as_view(), name='host-dashboard'),
    path('renter/', views.RenterDashboardView.as_view(), name='renter-dashboard'),
    
    # Analytics (Platform & Revenue)
    path('analytics/', views.PlatformAnalyticsView.as_view(), name='platform-analytics'),
    path('revenue/', views.RevenueAnalyticsView.as_view(), name='revenue-analytics'),
    
    # User Activity
    path('activity/', views.ActivityLogView.as_view(), name='activity-log'),
    
    # Customizable Widgets
    path('widgets/', views.DashboardWidgetListCreateView.as_view(), name='widget-list-create'),
    path('widgets/<uuid:widget_id>/', views.DashboardWidgetDetailView.as_view(), name='widget-detail'),
]
