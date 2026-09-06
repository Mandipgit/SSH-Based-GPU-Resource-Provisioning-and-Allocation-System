from django.urls import path
from . import views

app_name = 'reviews'

urlpatterns = [
    # List and Create
    path('', views.ReviewListCreateView.as_view(), name='review-list-create'),
    
    # Detail, Update, Delete
    path('<uuid:review_id>/', views.ReviewDetailView.as_view(), name='review-detail'),
    
    # Host Response
    path('<uuid:review_id>/respond/', views.ReviewHostResponseView.as_view(), name='review-respond'),
    
    # Summaries (Public)
    path('summary/host/<uuid:host_id>/', views.HostReviewSummaryView.as_view(), name='host-review-summary'),
    path('summary/gpu/<uuid:gpu_id>/', views.GPUReviewSummaryView.as_view(), name='gpu-review-summary'),
    
    # User-specific
    path('my-reviews/', views.MyReviewsListView.as_view(), name='my-reviews'),
    path('host/my-reviews/', views.MyReceivedReviewsListView.as_view(), name='my-received-reviews'),
    path('host/my-summary/', views.MyHostSummaryView.as_view(), name='my-host-summary'),
    path('can-review/<uuid:session_id>/', views.CanReviewSessionView.as_view(), name='can-review-session'),
]
