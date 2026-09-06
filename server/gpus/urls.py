# gpus/urls.py
from django.urls import path
from . import views

app_name = 'gpus'

urlpatterns = [
    # Public endpoints
    path('', views.GPUListView.as_view(), name='gpu-list'),
    path('<uuid:id>/', views.GPUDetailView.as_view(), name='gpu-detail'),
    path('available/', views.GPUAvailableListView.as_view(), name='gpu-available'),
    path('stats/', views.GPUMarketplaceStatsView.as_view(), name='gpu-stats'),
    
    # Host endpoints
    path('host/', views.HostGPUListView.as_view(), name='host-gpu-list'),
    path('host/stats/', views.HostGPUStatsView.as_view(), name='host-gpu-stats'),
    path('host/create/', views.GPUCreateView.as_view(), name='gpu-create'),
    path('host/<uuid:id>/update/', views.GPUUpdateView.as_view(), name='gpu-update'),
    path('host/<uuid:id>/delete/', views.GPUDeleteView.as_view(), name='gpu-delete'),
    path('host/<uuid:id>/availability/', views.GPUAvailabilityToggleView.as_view(), name='gpu-availability'),
    path('host/<uuid:id>/price/', views.GPUPriceUpdateView.as_view(), name='gpu-price'),
    path('host/<uuid:id>/stats/', views.GPUStatsView.as_view(), name='gpu-stats-detail'),
]