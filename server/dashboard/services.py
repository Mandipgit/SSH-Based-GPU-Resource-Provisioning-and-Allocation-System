from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from decimal import Decimal
from datetime import datetime, timedelta

from .models import DashboardWidget, PlatformAnalytics, UserActivityLog
from users.models import User, HostProfile
from gpus.models import GPU
from sessions.models import Session, HostEarning
from wallets.models import Wallet, Transaction
from reviews.models import Review


class ActivityLogger:
    """Helper service to log user activities"""

    @staticmethod
    def get_client_ip(request):
        if not request:
            return None
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @classmethod
    def log(cls, user, action, details=None, request=None, ip_address=None):
        if details is None:
            details = {}
        if request and not ip_address:
            ip_address = cls.get_client_ip(request)
        
        return UserActivityLog.objects.create(
            user=user if (user and user.is_authenticated) else None,
            action=action,
            details=details,
            ip_address=ip_address
        )


class AnalyticsAggregator:
    """Service to aggregate platform, revenue, host, and renter analytics"""

    @staticmethod
    def aggregate_daily_analytics(target_date=None):
        """Aggregate snapshot data for a specific date and record in PlatformAnalytics"""
        if not target_date:
            target_date = timezone.now().date()
        elif isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()

        day_start = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
        day_end = timezone.make_aware(datetime.combine(target_date, datetime.max.time()))

        total_users = User.objects.count()
        total_hosts = HostProfile.objects.count()
        total_gpus = GPU.objects.count()
        total_sessions = Session.objects.count()
        active_sessions = Session.objects.filter(status='active').count()

        # Revenue calculations from completed transactions
        rev_agg = Transaction.objects.filter(
            type__in=['rental_payment'],
            status='completed'
        ).aggregate(total=Sum('amount'))
        # rental_payment amount is stored negative in wallets.models, so take abs
        total_rev = abs(rev_agg['total'] or Decimal('0.00'))

        fee_agg = HostEarning.objects.filter(
            status='completed'
        ).aggregate(fees=Sum('platform_fee'))
        platform_fees = fee_agg['fees'] or Decimal('0.00')

        # Daily additions
        new_users = User.objects.filter(created_at__range=(day_start, day_end)).count()
        new_hosts = HostProfile.objects.filter(created_at__range=(day_start, day_end)).count()
        new_sessions = Session.objects.filter(created_at__range=(day_start, day_end)).count()

        analytics, _ = PlatformAnalytics.objects.update_or_create(
            date=target_date,
            defaults={
                'total_users': total_users,
                'total_hosts': total_hosts,
                'total_gpus': total_gpus,
                'total_sessions': total_sessions,
                'active_sessions': active_sessions,
                'total_revenue': total_rev,
                'platform_fees': platform_fees,
                'new_users': new_users,
                'new_hosts': new_hosts,
                'new_sessions': new_sessions,
            }
        )
        return analytics

    @staticmethod
    def get_platform_analytics(start_date=None, end_date=None, period='day'):
        """Query platform analytics with date range and period grouping"""
        today = timezone.now().date()
        if not end_date:
            end_date = today
        elif isinstance(end_date, str):
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        if not start_date:
            start_date = end_date - timedelta(days=30)
        elif isinstance(start_date, str):
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()

        queryset = PlatformAnalytics.objects.filter(
            date__range=(start_date, end_date)
        ).order_by('date')

        # If no snapshots exist in DB, build dynamic snapshot for today
        if not queryset.exists():
            AnalyticsAggregator.aggregate_daily_analytics(today)
            queryset = PlatformAnalytics.objects.filter(
                date__range=(start_date, end_date)
            ).order_by('date')

        items = list(queryset)

        # Overview totals
        latest = items[-1] if items else None
        overview = {
            'total_users': latest.total_users if latest else User.objects.count(),
            'total_hosts': latest.total_hosts if latest else HostProfile.objects.count(),
            'total_gpus': latest.total_gpus if latest else GPU.objects.count(),
            'total_sessions': latest.total_sessions if latest else Session.objects.count(),
            'active_sessions': Session.objects.filter(status='active').count(),
            'total_revenue': latest.total_revenue if latest else Decimal('0.00'),
            'platform_fees': latest.platform_fees if latest else Decimal('0.00'),
            'start_date': str(start_date),
            'end_date': str(end_date),
            'period': period,
        }

        # Daily timeline
        timeline = []
        for a in items:
            timeline.append({
                'date': str(a.date),
                'total_users': a.total_users,
                'total_hosts': a.total_hosts,
                'total_gpus': a.total_gpus,
                'total_sessions': a.total_sessions,
                'active_sessions': a.active_sessions,
                'total_revenue': float(a.total_revenue),
                'platform_fees': float(a.platform_fees),
                'new_users': a.new_users,
                'new_hosts': a.new_hosts,
                'new_sessions': a.new_sessions,
            })

        return {
            'overview': overview,
            'timeline': timeline,
        }

    @staticmethod
    def get_revenue_analytics(start_date=None, end_date=None, period='day'):
        """Detailed revenue analytics breakdown"""
        today = timezone.now().date()
        if not end_date:
            end_date = today
        elif isinstance(end_date, str):
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        if not start_date:
            start_date = end_date - timedelta(days=30)
        elif isinstance(start_date, str):
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()

        start_dt = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        end_dt = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))

        earnings_qs = HostEarning.objects.filter(
            created_at__range=(start_dt, end_dt)
        )

        agg = earnings_qs.aggregate(
            gross_revenue=Sum('amount'),
            platform_fees=Sum('platform_fee'),
            host_net_earnings=Sum('net_amount'),
            total_earnings_count=Count('id')
        )

        gross_rev = agg['gross_revenue'] or Decimal('0.00')
        platform_fees = agg['platform_fees'] or Decimal('0.00')
        host_net = agg['host_net_earnings'] or Decimal('0.00')

        # Refunds in range
        refunds_agg = Transaction.objects.filter(
            type='refund',
            status='completed',
            created_at__range=(start_dt, end_dt)
        ).aggregate(total_refunds=Sum('amount'))
        total_refunds = refunds_agg['total_refunds'] or Decimal('0.00')

        # Periodic timeline grouping
        trunc_fn = TruncDate('created_at')
        if period == 'week':
            trunc_fn = TruncWeek('created_at')
        elif period == 'month':
            trunc_fn = TruncMonth('created_at')

        timeline_data = earnings_qs.annotate(
            bucket=trunc_fn
        ).values('bucket').annotate(
            gross=Sum('amount'),
            fees=Sum('platform_fee'),
            net=Sum('net_amount'),
            count=Count('id')
        ).order_by('bucket')

        timeline = [
            {
                'period': item['bucket'].strftime('%Y-%m-%d') if item['bucket'] else '',
                'gross_revenue': float(item['gross'] or 0),
                'platform_fees': float(item['fees'] or 0),
                'host_net_earnings': float(item['net'] or 0),
                'sessions_count': item['count']
            }
            for item in timeline_data
        ]

        return {
            'summary': {
                'start_date': str(start_date),
                'end_date': str(end_date),
                'period': period,
                'gross_revenue': float(gross_rev),
                'platform_fees': float(platform_fees),
                'host_net_earnings': float(host_net),
                'total_refunds': float(total_refunds),
                'completed_rentals': agg['total_earnings_count'] or 0,
            },
            'timeline': timeline
        }

    @staticmethod
    def get_renter_dashboard_data(user):
        """Build dashboard dataset for a renter"""
        wallet = getattr(user, 'wallet', None)
        balance = wallet.balance if wallet else Decimal('0.00')
        available_balance = wallet.available_balance if wallet else Decimal('0.00')
        hold_amount = wallet.hold_amount if wallet else Decimal('0.00')

        user_sessions = Session.objects.filter(renter=user).select_related('gpu', 'host__user')
        active_sessions_qs = user_sessions.filter(status='active').order_by('-start_time')
        completed_sessions_qs = user_sessions.filter(status__in=['completed', 'terminated'])

        total_sessions = user_sessions.count()
        active_count = active_sessions_qs.count()
        completed_count = completed_sessions_qs.count()

        # Total spent calculation
        spent_agg = user_sessions.filter(
            status__in=['completed', 'terminated']
        ).aggregate(spent=Sum('total_amount'))
        total_spent = spent_agg['spent'] or Decimal('0.00')

        # Recent sessions
        recent_sessions_data = []
        for s in user_sessions.order_by('-created_at')[:5]:
            recent_sessions_data.append({
                'id': str(s.id),
                'gpu_name': s.gpu.gpu_name if s.gpu else 'GPU',
                'host_email': s.host.user.email if s.host else 'Host',
                'status': s.status,
                'total_amount': float(s.total_amount or 0.0),
                'duration_hours': s.duration_hours or 0.0,
                'start_time': s.start_time.isoformat() if s.start_time else None,
                'created_at': s.created_at.isoformat() if s.created_at else None,
            })

        # Active sessions list
        active_sessions_data = []
        for s in active_sessions_qs:
            active_sessions_data.append({
                'id': str(s.id),
                'gpu_name': s.gpu.gpu_name if s.gpu else 'GPU',
                'host_email': s.host.user.email if s.host else 'Host',
                'ssh_connection_string': s.ssh_connection_string,
                'start_time': s.start_time.isoformat() if s.start_time else None,
                'active_time': s.active_time.isoformat() if s.active_time else None,
                'duration_hours': round(s.get_duration_in_hours(), 2),
                'cost_so_far': round(s.get_cost_so_far(), 2),
            })

        # Spending history (last 6 months)
        spending_trend = user_sessions.filter(
            status__in=['completed', 'terminated']
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            spent=Sum('total_amount'),
            count=Count('id')
        ).order_by('-month')[:6]

        spending_history = [
            {
                'month': item['month'].strftime('%Y-%m') if item['month'] else '',
                'amount': float(item['spent'] or 0),
                'sessions': item['count']
            }
            for item in spending_trend
        ]

        # Recent activity logs
        activities = UserActivityLog.objects.filter(user=user).order_by('-created_at')[:5]
        activity_data = [
            {
                'action': a.action,
                'details': a.details,
                'created_at': a.created_at.isoformat()
            }
            for a in activities
        ]

        return {
            'role': 'renter',
            'wallet': {
                'balance': float(balance),
                'available_balance': float(available_balance),
                'hold_amount': float(hold_amount),
                'currency': wallet.currency if wallet else 'NPR',
            },
            'stats': {
                'total_sessions': total_sessions,
                'active_sessions': active_count,
                'completed_sessions': completed_count,
                'total_spent': float(total_spent),
            },
            'active_sessions': active_sessions_data,
            'recent_sessions': recent_sessions_data,
            'spending_history': spending_history,
            'recent_activity': activity_data,
        }

    @staticmethod
    def get_host_dashboard_data(user):
        """Build dashboard dataset for a host"""
        host_profile = getattr(user, 'host_profile', None)
        if not host_profile:
            return {
                'role': 'host',
                'error': 'User does not have a host profile'
            }

        gpus_qs = GPU.objects.filter(host=host_profile)
        total_gpus = gpus_qs.count()
        available_gpus = gpus_qs.filter(is_available=True, current_session_id__isnull=True).count()
        rented_gpus = gpus_qs.filter(current_session_id__isnull=False).count()

        host_sessions = Session.objects.filter(host=host_profile).select_related('gpu', 'renter')
        active_sessions_qs = host_sessions.filter(status='active').order_by('-start_time')
        total_sessions = host_sessions.count()
        active_sessions_count = active_sessions_qs.count()

        # Reviews rating summary
        review_summary = Review.objects.filter(host=host_profile).summary_stats()

        # GPU list details
        gpu_list = []
        for g in gpus_qs:
            gpu_list.append({
                'id': str(g.id),
                'gpu_name': g.gpu_name,
                'vram_gb': g.vram_gb,
                'price_per_hour': float(g.price_per_hour),
                'is_available': g.is_available,
                'is_rented': g.current_session_id is not None,
                'total_rental_hours': float(g.total_rental_hours or 0),
                'total_earnings': float(g.total_earnings or 0),
                'total_sessions': g.total_sessions,
            })

        # Recent sessions
        recent_sessions_data = []
        for s in host_sessions.order_by('-created_at')[:5]:
            recent_sessions_data.append({
                'id': str(s.id),
                'gpu_name': s.gpu.gpu_name if s.gpu else 'GPU',
                'renter_email': s.renter.email if s.renter else 'Renter',
                'status': s.status,
                'total_amount': float(s.total_amount or 0.0),
                'duration_hours': s.duration_hours or 0.0,
                'created_at': s.created_at.isoformat() if s.created_at else None,
            })

        # Earnings trend (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        daily_earnings = HostEarning.objects.filter(
            host=host_profile,
            created_at__gte=thirty_days_ago
        ).annotate(
            day=TruncDate('created_at')
        ).values('day').annotate(
            net=Sum('net_amount'),
            count=Count('id')
        ).order_by('day')

        earnings_trend = [
            {
                'date': item['day'].strftime('%Y-%m-%d') if item['day'] else '',
                'amount': float(item['net'] or 0),
                'sessions': item['count']
            }
            for item in daily_earnings
        ]

        # Recent activities
        activities = UserActivityLog.objects.filter(user=user).order_by('-created_at')[:5]
        activity_data = [
            {
                'action': a.action,
                'details': a.details,
                'created_at': a.created_at.isoformat()
            }
            for a in activities
        ]

        return {
            'role': 'host',
            'host_status': host_profile.status,
            'stats': {
                'total_earnings': float(host_profile.total_earnings or Decimal('0.00')),
                'pending_payout': float(host_profile.pending_payout or Decimal('0.00')),
                'uptime_percentage': float(host_profile.uptime_percentage or 0.0),
                'reliability_score': host_profile.reliability_score or 100,
                'penalty_points': host_profile.penalty_points or 0,
                'total_gpus': total_gpus,
                'available_gpus': available_gpus,
                'rented_gpus': rented_gpus,
                'total_sessions': total_sessions,
                'active_sessions': active_sessions_count,
                'total_rental_hours': float(host_profile.total_rental_hours or 0.0),
                'average_rating': review_summary['average_rating'],
                'total_reviews': review_summary['total_reviews'],
            },
            'gpus': gpu_list,
            'recent_sessions': recent_sessions_data,
            'earnings_trend': earnings_trend,
            'recent_activity': activity_data,
        }

    @staticmethod
    def get_admin_dashboard_data():
        """Build dashboard dataset for an administrator"""
        total_users = User.objects.count()
        total_hosts = HostProfile.objects.count()
        total_renters = User.objects.filter(role__in=['renter', 'both']).count()

        total_gpus = GPU.objects.count()
        available_gpus = GPU.objects.filter(is_available=True, current_session_id__isnull=True).count()
        rented_gpus = GPU.objects.filter(current_session_id__isnull=False).count()

        total_sessions = Session.objects.count()
        active_sessions = Session.objects.filter(status='active').count()
        completed_sessions = Session.objects.filter(status='completed').count()
        failed_sessions = Session.objects.filter(status='failed').count()

        rev_agg = HostEarning.objects.aggregate(
            gross=Sum('amount'),
            fees=Sum('platform_fee'),
            payouts=Sum('net_amount')
        )

        recent_users = User.objects.order_by('-created_at')[:5].values('id', 'email', 'role', 'created_at')
        recent_sessions = Session.objects.order_by('-created_at')[:5].values(
            'id', 'gpu__gpu_name', 'renter__email', 'host__user__email', 'status', 'total_amount', 'created_at'
        )
        recent_activity = UserActivityLog.objects.order_by('-created_at')[:8].values(
            'id', 'user__email', 'action', 'details', 'created_at'
        )

        return {
            'role': 'admin',
            'platform_stats': {
                'total_users': total_users,
                'total_hosts': total_hosts,
                'total_renters': total_renters,
                'total_gpus': total_gpus,
                'available_gpus': available_gpus,
                'rented_gpus': rented_gpus,
                'total_sessions': total_sessions,
                'active_sessions': active_sessions,
                'completed_sessions': completed_sessions,
                'failed_sessions': failed_sessions,
                'total_revenue': float(rev_agg['gross'] or 0),
                'platform_fees': float(rev_agg['fees'] or 0),
                'host_payouts': float(rev_agg['payouts'] or 0),
            },
            'recent_users': list(recent_users),
            'recent_sessions': list(recent_sessions),
            'recent_activity': list(recent_activity),
        }

    @staticmethod
    def get_dashboard_summary(user):
        """Unified dashboard summary dispatches to appropriate role-aware view"""
        if getattr(user, 'is_admin', False) or user.is_staff or user.is_superuser:
            return AnalyticsAggregator.get_admin_dashboard_data()
        elif getattr(user, 'is_host', False) and not getattr(user, 'is_renter', False):
            return AnalyticsAggregator.get_host_dashboard_data(user)
        elif getattr(user, 'is_renter', False) and not getattr(user, 'is_host', False):
            return AnalyticsAggregator.get_renter_dashboard_data(user)
        else:
            # User has role 'both' or combined
            return {
                'role': 'both',
                'renter': AnalyticsAggregator.get_renter_dashboard_data(user),
                'host': AnalyticsAggregator.get_host_dashboard_data(user),
            }


class WidgetService:
    """Service for managing dashboard widgets"""

    DEFAULT_RENTER_WIDGETS = [
        ('wallet', 1, {}),
        ('sessions', 2, {'limit': 5}),
        ('activity', 3, {'limit': 5}),
    ]

    DEFAULT_HOST_WIDGETS = [
        ('earnings', 1, {}),
        ('gpus', 2, {}),
        ('sessions', 3, {'limit': 5}),
        ('reviews', 4, {}),
        ('activity', 5, {'limit': 5}),
    ]

    @classmethod
    def initialize_default_widgets(cls, user):
        if not user or not user.is_authenticated:
            return []
        
        existing = DashboardWidget.objects.filter(user=user).exists()
        if existing:
            return DashboardWidget.objects.filter(user=user)

        widgets_to_create = []
        is_host = getattr(user, 'is_host', False)
        is_renter = getattr(user, 'is_renter', False)

        if is_host:
            for wtype, pos, settings_dict in cls.DEFAULT_HOST_WIDGETS:
                widgets_to_create.append(DashboardWidget(
                    user=user,
                    widget_type=wtype,
                    position=pos,
                    settings=settings_dict,
                    is_active=True
                ))
        elif is_renter:
            for wtype, pos, settings_dict in cls.DEFAULT_RENTER_WIDGETS:
                widgets_to_create.append(DashboardWidget(
                    user=user,
                    widget_type=wtype,
                    position=pos,
                    settings=settings_dict,
                    is_active=True
                ))

        if widgets_to_create:
            DashboardWidget.objects.bulk_create(widgets_to_create)

        return DashboardWidget.objects.filter(user=user)
