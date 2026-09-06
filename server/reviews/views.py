from rest_framework import generics, status, permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes, OpenApiResponse, inline_serializer

from .models import Review
from .serializers import (
    ReviewDetailSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer,
    ReviewHostResponseSerializer,
    ReviewSummarySerializer,
)
from .permissions import IsReviewAuthorOrReadOnly, IsReviewHost
from sessions.models import Session
from users.models import HostProfile
from gpus.models import GPU
from notifications.services import NotificationService


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ReviewListCreateView(generics.ListCreateAPIView):
    """
    GET: List reviews with filtering and pagination (Public / Authenticated).
    POST: Create a review for a completed session (Authenticated Renters).
    """
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewDetailSerializer

    def get_queryset(self):
        queryset = Review.objects.select_related('renter', 'host__user', 'gpu', 'session').all()
        params = self.request.query_params

        # Filter by GPU
        gpu_id = params.get('gpu_id') or params.get('gpu')
        if gpu_id:
            queryset = queryset.filter(gpu_id=gpu_id)

        # Filter by Host
        host_id = params.get('host_id') or params.get('host')
        if host_id:
            queryset = queryset.filter(host_id=host_id)

        # Filter by Renter
        renter_id = params.get('renter_id') or params.get('renter')
        if renter_id:
            queryset = queryset.filter(renter_id=renter_id)

        # Filter by Rating (exact or min)
        rating = params.get('rating')
        if rating:
            queryset = queryset.filter(rating=rating)

        min_rating = params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)

        # Filter by Verified status
        is_verified = params.get('is_verified')
        if is_verified is not None:
            if is_verified.lower() in ['true', '1']:
                queryset = queryset.filter(is_verified=True)
            elif is_verified.lower() in ['false', '0']:
                queryset = queryset.filter(is_verified=False)

        # Search in comments or GPU name
        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(comment__icontains=search) |
                Q(gpu__gpu_name__icontains=search)
            )

        # Sorting
        sort_by = params.get('sort_by', 'newest')
        if sort_by == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort_by == 'oldest':
            queryset = queryset.order_by('created_at')
        elif sort_by == 'highest_rating':
            queryset = queryset.order_by('-rating', '-created_at')
        elif sort_by == 'lowest_rating':
            queryset = queryset.order_by('rating', '-created_at')

        return queryset

    @extend_schema(
        parameters=[
            OpenApiParameter('gpu_id', OpenApiTypes.UUID, description='Filter by GPU ID'),
            OpenApiParameter('host_id', OpenApiTypes.UUID, description='Filter by Host ID'),
            OpenApiParameter('rating', OpenApiTypes.INT, description='Filter by exact rating (1-5)'),
            OpenApiParameter('min_rating', OpenApiTypes.INT, description='Filter by minimum rating (1-5)'),
            OpenApiParameter('is_verified', OpenApiTypes.BOOL, description='Filter by verified status'),
            OpenApiParameter('search', OpenApiTypes.STR, description='Search comment or GPU name'),
            OpenApiParameter('sort_by', OpenApiTypes.STR, description='Sort options: newest, oldest, highest_rating, lowest_rating'),
        ],
        responses={200: ReviewDetailSerializer(many=True)}
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        # Send notification to host
        try:
            NotificationService.notify_review_received(review.host.user, review)
        except Exception:
            pass

        output_serializer = ReviewDetailSerializer(review)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: View single review details.
    PATCH/PUT: Update review ratings or comment (Review Author only).
    DELETE: Delete review (Review Author or Admin only).
    """
    queryset = Review.objects.select_related('renter', 'host__user', 'gpu', 'session').all()
    lookup_field = 'id'
    lookup_url_kwarg = 'review_id'

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsReviewAuthorOrReadOnly()]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ReviewUpdateSerializer
        return ReviewDetailSerializer

    def perform_update(self, serializer):
        review = serializer.save()
        return review

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        detail_serializer = ReviewDetailSerializer(instance)
        return Response(detail_serializer.data)


class ReviewHostResponseView(APIView):
    """
    POST: Allows the host of a reviewed session to reply to the review.
    """
    permission_classes = [permissions.IsAuthenticated, IsReviewHost]

    @extend_schema(
        summary="Host reply to review",
        description="Allows the GPU host to post a response comment to a renter's review.",
        request=ReviewHostResponseSerializer,
        responses={
            200: ReviewDetailSerializer,
            400: OpenApiResponse(description="Invalid response payload"),
            403: OpenApiResponse(description="You are not the host for this review")
        }
    )
    def post(self, request, review_id):
        review = get_object_or_404(
            Review.objects.select_related('host__user', 'gpu', 'renter', 'session'),
            id=review_id
        )
        self.check_object_permissions(request, review)

        serializer = ReviewHostResponseSerializer(review, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Send notification to renter
        try:
            NotificationService.notify_review_response(review.renter, review)
        except Exception:
            pass

        output_serializer = ReviewDetailSerializer(review)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


class HostReviewSummaryView(APIView):
    """
    GET: Get rating summaries and distribution for a specific host.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: ReviewSummarySerializer})
    def get(self, request, host_id):
        host = get_object_or_404(HostProfile, id=host_id)
        summary = Review.objects.filter(host=host).summary_stats()
        summary['host_id'] = str(host.id)
        summary['host_email'] = host.user.email
        return Response(summary, status=status.HTTP_200_OK)


class GPUReviewSummaryView(APIView):
    """
    GET: Get rating summaries and distribution for a specific GPU.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: ReviewSummarySerializer})
    def get(self, request, gpu_id):
        gpu = get_object_or_404(GPU, id=gpu_id)
        summary = Review.objects.filter(gpu=gpu).summary_stats()
        summary['gpu_id'] = str(gpu.id)
        summary['gpu_name'] = gpu.gpu_name
        return Response(summary, status=status.HTTP_200_OK)


class MyReviewsListView(generics.ListAPIView):
    """
    GET: List reviews written by the current logged-in renter.
    """
    serializer_class = ReviewDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return Review.objects.select_related('renter', 'host__user', 'gpu', 'session').filter(
            renter=self.request.user
        ).order_by('-created_at')


class MyReceivedReviewsListView(generics.ListAPIView):
    """
    GET: List reviews received by the current logged-in host.
    """
    serializer_class = ReviewDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        host_profile = getattr(self.request.user, 'host_profile', None)
        if not host_profile:
            return Review.objects.none()
        return Review.objects.select_related('renter', 'host__user', 'gpu', 'session').filter(
            host=host_profile
        ).order_by('-created_at')


class MyHostSummaryView(APIView):
    """
    GET: Rating summary and distribution for current logged-in host.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: ReviewSummarySerializer})
    def get(self, request):
        host_profile = getattr(request.user, 'host_profile', None)
        if not host_profile:
            return Response(
                {"error": "User does not have a host profile."},
                status=status.HTTP_400_BAD_REQUEST
            )
        summary = Review.objects.filter(host=host_profile).summary_stats()
        summary['host_id'] = str(host_profile.id)
        summary['host_email'] = host_profile.user.email
        return Response(summary, status=status.HTTP_200_OK)


class CanReviewSessionView(APIView):
    """
    GET: Check if the logged-in user is eligible to review a given session.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Check review eligibility for session",
        description="Returns whether the logged-in user rented and completed the session, and hasn't reviewed it yet.",
        responses={
            200: inline_serializer(
                name='CanReviewResponse',
                fields={
                    'can_review': serializers.BooleanField(),
                    'reason': serializers.CharField(required=False),
                    'review_id': serializers.CharField(required=False),
                    'session_id': serializers.CharField(required=False),
                    'gpu_name': serializers.CharField(required=False),
                    'host_id': serializers.CharField(required=False),
                }
            )
        }
    )
    def get(self, request, session_id):
        try:
            session = Session.objects.select_related('gpu', 'host').get(id=session_id)
        except Session.DoesNotExist:
            return Response(
                {"can_review": False, "reason": "Session not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.renter_id != request.user.id:
            return Response(
                {"can_review": False, "reason": "You did not rent this session."},
                status=status.HTTP_200_OK
            )

        if session.status not in ['completed', 'terminated']:
            return Response(
                {
                    "can_review": False,
                    "reason": f"Session status is '{session.status}'. Only completed sessions can be reviewed."
                },
                status=status.HTTP_200_OK
            )

        if hasattr(session, 'review'):
            return Response(
                {
                    "can_review": False,
                    "reason": "You have already reviewed this session.",
                    "review_id": str(session.review.id)
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "can_review": True,
                "session_id": str(session.id),
                "gpu_name": session.gpu.gpu_name,
                "host_id": str(session.host_id),
            },
            status=status.HTTP_200_OK
        )

