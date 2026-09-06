from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils.dateparse import parse_date
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import DashboardWidget, PlatformAnalytics, UserActivityLog
from .serializers import (
    DashboardWidgetSerializer,
    PlatformAnalyticsSerializer,
    UserActivityLogSerializer,
    PlatformAnalyticsResponseSerializer,
    RevenueAnalyticsResponseSerializer,
    DashboardSummarySerializer,
)
from .permissions import IsRenter, IsHost, IsAdmin, IsHostOrAdmin, IsRenterOrAdmin
from .services import AnalyticsAggregator, WidgetService, ActivityLogger


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class DashboardSummaryView(APIView):
    """
    GET: Retrieve unified role-aware dashboard summary.
    - Renters see wallet balance, active sessions, recent sessions, total spent.
    - Hosts see total earnings, active sessions, GPUs, uptime, recent sessions.
    - Admins see platform stats (users, hosts, revenue, sessions).
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: DashboardSummarySerializer})
    def get(self, request):
        data = AnalyticsAggregator.get_dashboard_summary(request.user)
        return Response(data, status=status.HTTP_200_OK)


class PlatformAnalyticsView(APIView):
    """
    GET: Retrieve platform-wide analytics with date and period filters (Admin only).
    """
    permission_classes = [IsAdmin]

    @extend_schema(
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, description='Start date (YYYY-MM-DD)'),
            OpenApiParameter('end_date', OpenApiTypes.DATE, description='End date (YYYY-MM-DD)'),
            OpenApiParameter('period', OpenApiTypes.STR, description='Grouping period: day, week, month'),
        ],
        responses={200: PlatformAnalyticsResponseSerializer}
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period = request.query_params.get('period', 'day')

        data = AnalyticsAggregator.get_platform_analytics(
            start_date=start_date,
            end_date=end_date,
            period=period
        )
        return Response(data, status=status.HTTP_200_OK)


class RevenueAnalyticsView(APIView):
    """
    GET: Retrieve detailed revenue breakdown by day/week/month (Admin only).
    """
    permission_classes = [IsAdmin]

    @extend_schema(
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, description='Start date (YYYY-MM-DD)'),
            OpenApiParameter('end_date', OpenApiTypes.DATE, description='End date (YYYY-MM-DD)'),
            OpenApiParameter('period', OpenApiTypes.STR, description='Grouping period: day, week, month'),
        ],
        responses={200: RevenueAnalyticsResponseSerializer}
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period = request.query_params.get('period', 'day')

        data = AnalyticsAggregator.get_revenue_analytics(
            start_date=start_date,
            end_date=end_date,
            period=period
        )
        return Response(data, status=status.HTTP_200_OK)


class ActivityLogView(generics.ListAPIView):
    """
    GET: List recent user activity logs.
    - Regular users see only their own activity.
    - Admins can view platform-wide logs and filter by user, action, or date range.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserActivityLogSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params

        if getattr(user, 'is_admin', False) or user.is_staff or user.is_superuser:
            queryset = UserActivityLog.objects.select_related('user').all()
            user_id = params.get('user_id') or params.get('user')
            if user_id:
                queryset = queryset.filter(user_id=user_id)
        else:
            queryset = UserActivityLog.objects.filter(user=user)

        action = params.get('action')
        if action:
            queryset = queryset.filter(action=action)

        start_date = params.get('start_date')
        if start_date:
            parsed_start = parse_date(start_date)
            if parsed_start:
                queryset = queryset.filter(created_at__date__gte=parsed_start)

        end_date = params.get('end_date')
        if end_date:
            parsed_end = parse_date(end_date)
            if parsed_end:
                queryset = queryset.filter(created_at__date__lte=parsed_end)

        return queryset.order_by('-created_at')

    @extend_schema(
        parameters=[
            OpenApiParameter('user_id', OpenApiTypes.UUID, description='Filter by User ID (Admin only)'),
            OpenApiParameter('action', OpenApiTypes.STR, description='Filter by action type'),
            OpenApiParameter('start_date', OpenApiTypes.DATE, description='Start date (YYYY-MM-DD)'),
            OpenApiParameter('end_date', OpenApiTypes.DATE, description='End date (YYYY-MM-DD)'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class HostDashboardView(APIView):
    """
    GET: Host-specific dashboard with GPU stats, session stats, earnings trend.
    """
    permission_classes = [IsHostOrAdmin]

    @extend_schema(
        summary="Host analytics overview",
        description="Returns GPU fleet metrics, uptime, session statistics, and earnings trend.",
        responses={200: DashboardSummarySerializer}
    )
    def get(self, request):
        data = AnalyticsAggregator.get_host_dashboard_data(request.user)
        return Response(data, status=status.HTTP_200_OK)


class RenterDashboardView(APIView):
    """
    GET: Renter-specific dashboard with wallet, session history, spending stats.
    """
    permission_classes = [IsRenterOrAdmin]

    @extend_schema(
        summary="Renter analytics overview",
        description="Returns wallet balance, active rentals, total spend, and recent session history.",
        responses={200: DashboardSummarySerializer}
    )
    def get(self, request):
        data = AnalyticsAggregator.get_renter_dashboard_data(request.user)
        return Response(data, status=status.HTTP_200_OK)


class DashboardWidgetListCreateView(generics.ListCreateAPIView):
    """
    GET: List active user dashboard widgets.
    POST: Create a new custom widget for the user.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardWidgetSerializer

    @extend_schema(summary="List user customized dashboard widgets")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary="Create a custom dashboard widget")
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def get_queryset(self):
        # Auto initialize default widgets if none exist
        WidgetService.initialize_default_widgets(self.request.user)
        return DashboardWidget.objects.filter(user=self.request.user).order_by('position', 'created_at')


class DashboardWidgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PATCH, PUT, DELETE: Manage individual user dashboard widget.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardWidgetSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'widget_id'

    @extend_schema(summary="Get widget details")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary="Update widget configuration or position")
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(summary="Delete a widget")
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)

    def get_queryset(self):
        return DashboardWidget.objects.filter(user=self.request.user)
