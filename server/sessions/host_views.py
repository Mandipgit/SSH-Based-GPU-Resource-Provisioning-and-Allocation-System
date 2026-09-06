from rest_framework import generics, status, permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Avg, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer, OpenApiParameter

from .models import Session, SessionMetric, HostEarning, HostPenaltyLog
from .serializers import (
    SessionSerializer,
    HostEarningSerializer,
    HostPenaltyLogSerializer,
    HostPenaltyAppealSerializer,
    HostSettingsSerializer,
    HostAutoAcceptSerializer
)
from .permissions import IsHostWithSession


class HostDashboardView(APIView):
    """Get comprehensive host dashboard data and metrics"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Host analytics dashboard",
        description="Returns live sessions count, GPU fleet status, daily/weekly/monthly revenue totals, and per-GPU statistics.",
        responses={
            200: inline_serializer(
                name='HostDashboardResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def get(self, request):
        host = getattr(request.user, 'host_profile', None)
        if not host:
            return Response({
                'status': 'error',
                'message': 'Host profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Sessions stats
        host_sessions = Session.objects.filter(host=host)
        total_sessions = host_sessions.count()
        active_sessions = host_sessions.filter(
            status__in=['active', 'starting', 'container_running', 'tunnel_connecting']
        ).count()
        completed_sessions = host_sessions.filter(
            status__in=['completed', 'terminated']
        ).count()
        
        # GPU Fleet stats
        gpus = host.gpus.all()
        total_gpus = gpus.count()
        available_gpus = gpus.filter(is_available=True, current_session_id__isnull=True).count()
        rented_gpus = total_gpus - available_gpus
        
        # Earnings calculation via HostEarning & completed sessions
        host_earnings_qs = HostEarning.objects.filter(host=host)
        
        earnings_today = host_earnings_qs.filter(
            created_at__date=today
        ).aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')
        
        earnings_week = host_earnings_qs.filter(
            created_at__gte=week_ago
        ).aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')
        
        earnings_month = host_earnings_qs.filter(
            created_at__gte=month_ago
        ).aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')
        
        # If no HostEarning records exist yet, fallback to session completed sums
        if host_earnings_qs.count() == 0:
            for s in host_sessions.filter(status='completed', end_time__isnull=False):
                cost = Decimal(str(s.actual_cost or 0)) * Decimal('0.90')
                if s.end_time.date() == today:
                    earnings_today += cost
                if s.end_time >= week_ago:
                    earnings_week += cost
                if s.end_time >= month_ago:
                    earnings_month += cost
        
        # Sessions & Utilization by GPU
        sessions_by_gpu = []
        for gpu in gpus:
            gpu_sessions = host_sessions.filter(gpu=gpu)
            gpu_session_count = gpu_sessions.count()
            gpu_hours = gpu_sessions.aggregate(total=Sum('duration_hours'))['total'] or 0.0
            
            # Avg utilization for this GPU
            avg_util = SessionMetric.objects.filter(
                session__gpu=gpu
            ).aggregate(avg=Avg('gpu_utilization_pct'))['avg']
            
            sessions_by_gpu.append({
                'gpu_id': str(gpu.id),
                'gpu_name': gpu.gpu_name,
                'vram_gb': gpu.vram_gb,
                'price_per_hour': float(gpu.price_per_hour),
                'is_available': gpu.is_available,
                'total_sessions': gpu_session_count,
                'total_hours': round(float(gpu_hours), 2) if gpu_hours else round(float(gpu.total_rental_hours), 2),
                'earnings': round(float(gpu.total_earnings), 2),
                'avg_utilization_pct': round(float(avg_util), 1) if avg_util is not None else None,
            })
        
        # Recent sessions
        recent_sessions = host_sessions.select_related('gpu', 'renter').order_by('-created_at')[:10]
        
        return Response({
            'status': 'success',
            'data': {
                'stats': {
                    'total_sessions': total_sessions,
                    'active_sessions': active_sessions,
                    'completed_sessions': completed_sessions,
                    'total_gpus': total_gpus,
                    'available_gpus': available_gpus,
                    'rented_gpus': rented_gpus,
                    'uptime_percentage': host.uptime_percentage,
                    'reliability_score': host.reliability_score,
                    'penalty_points': host.penalty_points,
                    'total_rental_hours': round(float(host.total_rental_hours), 2),
                },
                'earnings': {
                    'total': round(float(host.total_earnings), 2),
                    'pending_payout': round(float(host.pending_payout), 2),
                    'today': round(float(earnings_today), 2),
                    'this_week': round(float(earnings_week), 2),
                    'this_month': round(float(earnings_month), 2),
                },
                'sessions_by_gpu': sessions_by_gpu,
                'recent_sessions': SessionSerializer(recent_sessions, many=True).data,
                'host_status': host.status,
                'auto_accept': host.auto_accept,
                'last_heartbeat': host.last_heartbeat,
            }
        })


class HostEarningsView(APIView):
    """Get host earnings history and breakdown"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Host earnings and payouts breakdown",
        description="Fetches total earnings, platform fee deduction records, and payout logs.",
        responses={
            200: inline_serializer(
                name='HostEarningsResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def get(self, request):
        host = request.user.host_profile
        
        # Fetch HostEarning records
        earnings_qs = HostEarning.objects.filter(
            host=host
        ).select_related('session', 'session__gpu').order_by('-created_at')
        
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        total_count = earnings_qs.count()
        paginated_earnings = earnings_qs[offset:offset + limit]
        
        # Aggregate totals
        total_gross = earnings_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_fees = earnings_qs.aggregate(total=Sum('platform_fee'))['total'] or Decimal('0.00')
        total_net = earnings_qs.aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')
        
        # Fallback to host.total_earnings if no HostEarning records yet
        if total_count == 0 and host.total_earnings > 0:
            total_net = host.total_earnings
        
        return Response({
            'status': 'success',
            'data': {
                'summary': {
                    'total_gross': round(float(total_gross), 2),
                    'total_fees': round(float(total_fees), 2),
                    'net_earnings': round(float(total_net), 2),
                    'pending_payout': round(float(host.pending_payout), 2),
                    'total_sessions': total_count or host.total_sessions,
                },
                'pagination': {
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                },
                'history': HostEarningSerializer(paginated_earnings, many=True).data
            }
        })


class HostEarningsSummaryView(APIView):
    """Get detailed time-series earnings summary (daily/weekly/monthly)"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Host time-series earnings analytics",
        description="Returns earnings aggregated by day for trend charts.",
        parameters=[
            OpenApiParameter(name='days', type=int, default=30, description='Number of days history (e.g. 7, 30, 90)')
        ],
        responses={
            200: inline_serializer(
                name='HostEarningsSummaryResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def get(self, request):
        host = request.user.host_profile
        days = int(request.query_params.get('days', 30))
        
        now = timezone.now()
        start_date = now - timedelta(days=days)
        
        earnings = HostEarning.objects.filter(
            host=host,
            created_at__gte=start_date
        ).order_by('created_at')
        
        # Group by day including today
        daily_breakdown = {}
        for i in range(days + 1):
            day_str = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
            daily_breakdown[day_str] = {
                'date': day_str,
                'gross_amount': 0.0,
                'platform_fee': 0.0,
                'net_amount': 0.0,
                'sessions_count': 0
            }
            
        for earning in earnings:
            day_str = earning.created_at.strftime('%Y-%m-%d')
            if day_str not in daily_breakdown:
                daily_breakdown[day_str] = {
                    'date': day_str,
                    'gross_amount': 0.0,
                    'platform_fee': 0.0,
                    'net_amount': 0.0,
                    'sessions_count': 0
                }
            daily_breakdown[day_str]['gross_amount'] += float(earning.amount)
            daily_breakdown[day_str]['platform_fee'] += float(earning.platform_fee)
            daily_breakdown[day_str]['net_amount'] += float(earning.net_amount)
            daily_breakdown[day_str]['sessions_count'] += 1
        
        # Summary metrics
        total_net = sum(item['net_amount'] for item in daily_breakdown.values())
        total_sessions = sum(item['sessions_count'] for item in daily_breakdown.values())
        avg_per_session = round(total_net / total_sessions, 2) if total_sessions > 0 else 0.0
        
        return Response({
            'status': 'success',
            'data': {
                'period_days': days,
                'total_net_in_period': round(total_net, 2),
                'total_sessions_in_period': total_sessions,
                'average_per_session': avg_per_session,
                'chart_data': list(daily_breakdown.values())
            }
        })


class HostPenaltiesView(APIView):
    """Get host penalty history, reliability score, and appeal statuses"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Host penalties and reliability history",
        description="Returns host reliability rating, penalty points, and violation records.",
        responses={
            200: inline_serializer(
                name='HostPenaltiesResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def get(self, request):
        host = request.user.host_profile
        
        penalties = HostPenaltyLog.objects.filter(
            host=host
        ).select_related('session').order_by('-created_at')
        
        return Response({
            'status': 'success',
            'data': {
                'penalty_points': host.penalty_points,
                'reliability_score': host.reliability_score,
                'host_status': host.status,
                'total_penalties': penalties.count(),
                'penalties': HostPenaltyLogSerializer(penalties, many=True).data
            }
        })


class HostPenaltyAppealView(APIView):
    """Submit an appeal for a host penalty"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Submit host penalty appeal",
        description="Allows a host to dispute a reliability penalty.",
        request=HostPenaltyAppealSerializer,
        responses={
            200: inline_serializer(
                name='PenaltyAppealResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(),
                    'data': HostPenaltyLogSerializer()
                }
            ),
            400: OpenApiResponse(description="Appeal already submitted or invalid reason")
        }
    )
    def post(self, request, penalty_id):
        host = request.user.host_profile
        penalty = get_object_or_404(HostPenaltyLog, id=penalty_id, host=host)
        
        if penalty.appeal_status in ['pending', 'approved']:
            return Response({
                'status': 'error',
                'message': f'Appeal already submitted with status: {penalty.appeal_status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = HostPenaltyAppealSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        penalty.appeal_reason = serializer.validated_data['appeal_reason']
        penalty.appeal_status = 'pending'
        penalty.appealed_at = timezone.now()
        penalty.save()
        
        return Response({
            'status': 'success',
            'message': 'Penalty appeal submitted successfully. Admins will review your case.',
            'data': HostPenaltyLogSerializer(penalty).data
        })


class HostSettingsView(APIView):
    """Get and update host operational settings and preferences"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Retrieve host settings",
        description="Fetch auto-accept mode, max rental duration, and notification preferences.",
        responses={
            200: inline_serializer(
                name='HostSettingsResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def get(self, request):
        host = request.user.host_profile
        
        return Response({
            'status': 'success',
            'data': {
                'auto_accept': host.auto_accept,
                'max_rental_hours': host.max_rental_hours,
                'notification_preferences': host.notification_preferences,
                'availability_schedule': host.availability_schedule,
                'location': host.location,
                'internet_type': host.internet_type,
            }
        })
    
    @extend_schema(
        summary="Update host operational settings",
        description="Update auto-accept mode, notification preferences, or schedule.",
        request=HostSettingsSerializer,
        responses={
            200: inline_serializer(
                name='HostSettingsUpdateResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def patch(self, request):
        host = request.user.host_profile
        serializer = HostSettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        allowed_fields = [
            'auto_accept', 'max_rental_hours',
            'notification_preferences', 'availability_schedule',
            'location', 'internet_type'
        ]
        
        for field in allowed_fields:
            if field in request.data:
                setattr(host, field, request.data[field])
        
        host.save()
        
        return Response({
            'status': 'success',
            'message': 'Host settings updated successfully',
            'data': {
                'auto_accept': host.auto_accept,
                'max_rental_hours': host.max_rental_hours,
                'notification_preferences': host.notification_preferences,
                'availability_schedule': host.availability_schedule,
                'location': host.location,
                'internet_type': host.internet_type,
            }
        })


class HostAutoAcceptToggleView(APIView):
    """Quick toggle or set auto-accept state for the host"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Toggle host auto-accept mode",
        description="Enable or disable instant automatic session approval.",
        request=HostAutoAcceptSerializer,
        responses={
            200: inline_serializer(
                name='AutoAcceptResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(),
                    'data': inline_serializer(
                        name='AutoAcceptData',
                        fields={'auto_accept': serializers.BooleanField()}
                    )
                }
            )
        }
    )
    def post(self, request):
        host = request.user.host_profile
        
        if 'auto_accept' in request.data:
            serializer = HostAutoAcceptSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            host.auto_accept = serializer.validated_data['auto_accept']
        else:
            host.auto_accept = not host.auto_accept
            
        host.save(update_fields=['auto_accept'])
        
        return Response({
            'status': 'success',
            'message': f"Auto-accept {'enabled' if host.auto_accept else 'disabled'}",
            'data': {
                'auto_accept': host.auto_accept
            }
        })


class HostSessionActionView(APIView):
    """Host manually accepts or rejects a pending session (if auto-accept is off)"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Host accept or reject pending session",
        description="Manual approval or rejection of a pending rental session.",
        request=inline_serializer(
            name='HostActionRequest',
            fields={
                'action': serializers.ChoiceField(choices=['accept', 'reject']),
                'reason': serializers.CharField(required=False)
            }
        ),
        responses={
            200: inline_serializer(
                name='HostActionResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(),
                    'session_status': serializers.CharField()
                }
            ),
            400: OpenApiResponse(description="Session not in pending state or invalid action")
        }
    )
    def post(self, request, session_id):
        host = request.user.host_profile
        session = get_object_or_404(Session, id=session_id, host=host)
        
        if session.status != 'pending':
            return Response({
                'status': 'error',
                'message': f'Cannot perform action on session with status: {session.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        action = request.data.get('action')
        if action not in ['accept', 'reject']:
            return Response({
                'status': 'error',
                'message': "Action must be either 'accept' or 'reject'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from notifications.services import NotificationService
        from .services.billing import BillingService
        
        if action == 'accept':
            return Response({
                'status': 'success',
                'message': 'Session accepted. Host agent should now initialize container.',
                'session_status': session.status
            })
            
        elif action == 'reject':
            reason = request.data.get('reason', 'Host declined the rental request')
            session.status = 'rejected'
            session.error_message = reason
            session.termination_reason = 'host_rejected'
            session.save()
            
            BillingService.release_hold(session)
            if session.relay_port_obj:
                session.relay_port_obj.release()
                
            NotificationService.notify_session_terminated(session, f"Host declined session: {reason}")
            
            return Response({
                'status': 'success',
                'message': 'Session rejected and hold released',
                'session_status': session.status
            })


class HostActivityView(APIView):
    """Recent chronological activity feed for host"""
    permission_classes = [IsHostWithSession]
    
    @extend_schema(
        summary="Host chronological activity timeline",
        description="Returns unified feed of session requests, completions, and penalties.",
        responses={
            200: inline_serializer(
                name='HostActivityFeedResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': inline_serializer(
                        name='HostActivityData',
                        fields={
                            'activity': serializers.ListField(child=serializers.DictField())
                        }
                    )
                }
            )
        }
    )
    def get(self, request):
        host = request.user.host_profile
        limit = int(request.query_params.get('limit', 20))
        
        events = []
        
        # Recent sessions
        sessions = Session.objects.filter(host=host).order_by('-created_at')[:limit]
        for s in sessions:
            events.append({
                'type': 'session_created',
                'title': f'Session Requested for {s.gpu.gpu_name}',
                'status': s.status,
                'session_id': str(s.id),
                'amount': float(s.total_amount),
                'timestamp': s.created_at
            })
            if s.end_time:
                events.append({
                    'type': 'session_completed',
                    'title': f'Session Completed on {s.gpu.gpu_name}',
                    'status': s.status,
                    'session_id': str(s.id),
                    'actual_cost': float(s.actual_cost or 0),
                    'timestamp': s.end_time
                })
        
        # Recent penalties
        penalties = HostPenaltyLog.objects.filter(host=host).order_by('-created_at')[:10]
        for p in penalties:
            events.append({
                'type': 'penalty_applied',
                'title': f'Penalty Points Applied: {p.penalty_points} pts',
                'reason': p.reason,
                'appeal_status': p.appeal_status,
                'timestamp': p.created_at
            })
        
        # Sort all events chronologically descending
        events.sort(key=lambda x: x['timestamp'], reverse=True)
        events = events[:limit]
        
        return Response({
            'status': 'success',
            'data': {
                'activity': events
            }
        })
