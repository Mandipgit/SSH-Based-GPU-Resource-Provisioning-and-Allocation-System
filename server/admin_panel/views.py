from rest_framework import generics, status, permissions, filters, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum, Avg, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from users.models import User, HostProfile
from wallets.models import Wallet, Transaction
from sessions.models import Session, HostEarning
from gpus.models import GPU
from reviews.models import Review
from notifications.services import NotificationService
from .models import SystemSetting, SystemLog
from .serializers import (
    AdminUserSerializer, AdminHostSerializer, AdminSessionSerializer,
    AdminTransactionSerializer, AdminGPUSerializer, AdminReviewSerializer,
    SystemSettingSerializer, SystemLogSerializer, AdminDashboardSerializer
)
from rest_framework.pagination import PageNumberPagination
from .permissions import IsAdminUser, IsAdminOrStaff


from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer, OpenApiParameter


class StandardAdminPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# =============================================================================
# ADMIN DASHBOARD
# =============================================================================

class AdminDashboardView(APIView):
    """Admin dashboard overview with comprehensive platform metrics"""
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Admin platform overview dashboard",
        description="Returns global platform statistics: user counts, active GPU sessions, revenue totals, platform fee collection, and recent activity logs.",
        responses={200: AdminDashboardSerializer}
    )
    def get(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        
        # User stats
        total_users = User.objects.count()
        total_hosts = HostProfile.objects.count()
        total_renters = User.objects.filter(role__in=['renter', 'both']).count()
        
        # New users (last 7 days)
        new_users = User.objects.filter(created_at__gte=week_ago).count()
        new_hosts = HostProfile.objects.filter(created_at__gte=week_ago).count()
        
        # GPU stats
        total_gpus = GPU.objects.count()
        available_gpus = GPU.objects.filter(is_available=True, current_session_id__isnull=True).count()
        rented_gpus = GPU.objects.filter(current_session_id__isnull=False).count()
        
        # Session stats
        active_sessions = Session.objects.filter(status='active').count()
        pending_sessions = Session.objects.filter(status='pending').count()
        total_sessions = Session.objects.count()
        completed_sessions = Session.objects.filter(status='completed').count()
        failed_sessions = Session.objects.filter(status='failed').count()
        
        # Revenue stats
        rev_agg = Transaction.objects.filter(
            type='rental_payment',
            status='completed'
        ).aggregate(total=Sum('amount'))
        total_revenue = abs(rev_agg['total'] or Decimal('0.00'))
        
        fee_agg = HostEarning.objects.filter(
            status='completed'
        ).aggregate(total=Sum('platform_fee'))
        platform_fees = fee_agg['total'] or Decimal('0.00')
        
        # Pending items
        pending_withdrawals = Transaction.objects.filter(
            type='withdrawal',
            status='pending'
        ).count()
        
        total_reviews = Review.objects.count()
        
        # Recent activity (last 10 sessions)
        recent_sessions = Session.objects.select_related(
            'renter', 'host__user', 'gpu'
        ).order_by('-created_at')[:10]
        
        recent_activity = []
        for session in recent_sessions:
            recent_activity.append({
                'type': 'session',
                'id': str(session.id),
                'renter': session.renter.email if session.renter else 'N/A',
                'gpu': session.gpu.gpu_name if session.gpu else 'GPU',
                'status': session.status,
                'total_amount': float(session.total_amount or 0.0),
                'created_at': session.created_at.isoformat() if session.created_at else None,
            })
        
        return Response({
            'status': 'success',
            'data': {
                'users': {
                    'total_users': total_users,
                    'total_hosts': total_hosts,
                    'total_renters': total_renters,
                    'new_users': new_users,
                    'new_hosts': new_hosts,
                },
                'gpus': {
                    'total_gpus': total_gpus,
                    'available_gpus': available_gpus,
                    'rented_gpus': rented_gpus,
                },
                'sessions': {
                    'total_sessions': total_sessions,
                    'active_sessions': active_sessions,
                    'pending_sessions': pending_sessions,
                    'completed_sessions': completed_sessions,
                    'failed_sessions': failed_sessions,
                },
                'financials': {
                    'total_revenue': float(total_revenue),
                    'platform_fees': float(platform_fees),
                    'pending_withdrawals': pending_withdrawals,
                },
                'reviews': {
                    'total_reviews': total_reviews,
                },
                'recent_activity': recent_activity,
            }
        }, status=status.HTTP_200_OK)


# =============================================================================
# USER MANAGEMENT
# =============================================================================

class AdminUserListView(generics.ListAPIView):
    """List all users with search and filter"""
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardAdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'email', 'last_login']


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or deactivate a user"""
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'id'

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


# =============================================================================
# HOST MANAGEMENT
# =============================================================================

class AdminHostListView(generics.ListAPIView):
    """List all hosts"""
    queryset = HostProfile.objects.select_related('user').all().order_by('-created_at')
    serializer_class = AdminHostSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardAdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__email', 'gpu_name', 'location']
    ordering_fields = ['created_at', 'status', 'total_earnings', 'reliability_score']


class AdminHostDetailView(generics.RetrieveUpdateAPIView):
    """Get and update host profile status or penalty"""
    queryset = HostProfile.objects.select_related('user').all()
    serializer_class = AdminHostSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'id'


# =============================================================================
# SESSION MANAGEMENT
# =============================================================================

class AdminSessionListView(generics.ListAPIView):
    """List all rental sessions"""
    queryset = Session.objects.select_related('renter', 'host__user', 'gpu').all().order_by('-created_at')
    serializer_class = AdminSessionSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardAdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['renter__email', 'host__user__email', 'gpu__gpu_name']
    ordering_fields = ['created_at', 'status', 'total_amount']


class AdminSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or terminate session as admin"""
    queryset = Session.objects.select_related('renter', 'host__user', 'gpu').all()
    serializer_class = AdminSessionSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'id'
    
    def perform_destroy(self, instance):
        instance.status = 'terminated'
        instance.termination_reason = 'admin_cancelled'
        instance.save()


# =============================================================================
# TRANSACTION & REFUND MANAGEMENT
# =============================================================================

class AdminTransactionListView(generics.ListAPIView):
    """List all transactions"""
    queryset = Transaction.objects.select_related('user').all().order_by('-created_at')
    serializer_class = AdminTransactionSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardAdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__email', 'description', 'reference_id']
    ordering_fields = ['created_at', 'amount', 'type', 'status']


class AdminTransactionDetailView(generics.RetrieveAPIView):
    """Get transaction details"""
    queryset = Transaction.objects.select_related('user').all()
    serializer_class = AdminTransactionSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'id'


class AdminTransactionRefundView(APIView):
    """Process admin refund for a rental payment transaction"""
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Admin refund rental transaction",
        description="Processes an administrative refund for a rental payment transaction, crediting the renter's wallet.",
        request=None,
        responses={
            200: inline_serializer(
                name='AdminRefundResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(),
                    'refund_transaction_id': serializers.CharField()
                }
            ),
            400: OpenApiResponse(description="Transaction not eligible for refund or already refunded")
        }
    )
    def post(self, request, id):
        transaction = get_object_or_404(Transaction.objects.select_related('user'), id=id)
        
        if transaction.type != 'rental_payment':
            return Response({
                'status': 'error',
                'message': 'Only rental payments can be refunded.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if transaction.status != 'completed':
            return Response({
                'status': 'error',
                'message': f'Cannot refund transaction with status "{transaction.status}".'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already refunded
        if Transaction.objects.filter(reference_id=str(transaction.id), type='refund').exists():
            return Response({
                'status': 'error',
                'message': 'This transaction has already been refunded.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refund_amount = abs(Decimal(str(transaction.amount)))
        user = transaction.user
        
        # Credit user's wallet
        wallet, _ = Wallet.objects.get_or_create(user=user)
        wallet.balance += refund_amount
        wallet.save()
        
        # Record completed refund transaction
        refund_tx = Transaction.objects.create(
            user=user,
            type='refund',
            amount=refund_amount,
            status='completed',
            session_id=transaction.session_id,
            reference_id=str(transaction.id),
            description=f'Admin refund for transaction {transaction.id}'
        )
        
        # Notify user
        try:
            NotificationService.notify_refund_processed(
                user=user,
                amount=float(refund_amount),
                session_id=str(transaction.session_id) if transaction.session_id else str(transaction.id)
            )
        except Exception:
            pass

        # Log system event
        try:
            SystemLog.objects.create(
                level='info',
                source='admin_panel.refund',
                message=f'Refund of NPR {refund_amount} processed for user {user.email}',
                details={'transaction_id': str(transaction.id), 'refund_tx_id': str(refund_tx.id)}
            )
        except Exception:
            pass
        
        return Response({
            'status': 'success',
            'message': f'Refund of {refund_amount} successfully processed for {user.email}.',
            'refund_transaction_id': str(refund_tx.id)
        }, status=status.HTTP_200_OK)


# =============================================================================
# GPU MANAGEMENT
# =============================================================================

class AdminGPUListView(generics.ListAPIView):
    """List all GPUs"""
    queryset = GPU.objects.select_related('host', 'host__user').all().order_by('-created_at')
    serializer_class = AdminGPUSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardAdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['gpu_name', 'host__user__email', 'location']
    ordering_fields = ['created_at', 'price_per_hour', 'vram_gb', 'is_available']


class AdminGPUDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, delete GPU"""
    queryset = GPU.objects.select_related('host', 'host__user').all()
    serializer_class = AdminGPUSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'id'


# =============================================================================
# REVIEW MANAGEMENT
# =============================================================================

class AdminReviewListView(generics.ListAPIView):
    """List all reviews"""
    queryset = Review.objects.select_related('renter', 'host__user', 'gpu').all().order_by('-created_at')
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardAdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['renter__email', 'host__user__email', 'comment', 'gpu__gpu_name']
    ordering_fields = ['created_at', 'rating', 'is_verified']


class AdminReviewModerateView(APIView):
    """Moderate (verify / unverify / delete) a review"""
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Moderate user review",
        description="Admin can verify, unverify, or delete a review.",
        request=inline_serializer(
            name='AdminReviewModerateRequest',
            fields={'action': serializers.ChoiceField(choices=['verify', 'unverify', 'delete'])}
        ),
        responses={
            200: inline_serializer(
                name='AdminReviewModerateResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField()
                }
            ),
            400: OpenApiResponse(description="Invalid moderation action")
        }
    )
    def patch(self, request, id):
        review = get_object_or_404(Review, id=id)
        action = request.data.get('action')  # 'verify', 'unverify', 'delete'
        
        if action not in ['verify', 'unverify', 'delete']:
            return Response({
                'status': 'error',
                'message': 'Action must be "verify", "unverify", or "delete".'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if action == 'delete':
            review.delete()
            return Response({
                'status': 'success',
                'message': 'Review deleted successfully.'
            }, status=status.HTTP_200_OK)
        elif action == 'verify':
            review.is_verified = True
            review.save()
        elif action == 'unverify':
            review.is_verified = False
            review.save()
        
        return Response({
            'status': 'success',
            'message': f'Review updated to is_verified={review.is_verified}.'
        }, status=status.HTTP_200_OK)


# =============================================================================
# SYSTEM SETTINGS
# =============================================================================

class SystemSettingListView(generics.ListCreateAPIView):
    """List and create system settings"""
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardAdminPagination


class SystemSettingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, delete system setting"""
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'key'


# =============================================================================
# SYSTEM LOGS
# =============================================================================

class SystemLogListView(generics.ListAPIView):
    """List system logs"""
    queryset = SystemLog.objects.all().order_by('-created_at')
    serializer_class = SystemLogSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardAdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['source', 'message']
    ordering_fields = ['created_at', 'level']


class SystemLogClearView(APIView):
    """Clear system logs"""
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Clear system audit logs",
        description="Deletes all system audit and event logs.",
        request=None,
        responses={
            200: inline_serializer(
                name='ClearLogsResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField()
                }
            )
        }
    )
    def delete(self, request):
        count = SystemLog.objects.count()
        SystemLog.objects.all().delete()
        
        return Response({
            'status': 'success',
            'message': f'{count} logs cleared'
        })