from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from users.models import User, HostProfile
from gpus.models import GPU
from sessions.models import Session, HostEarning
from wallets.models import Wallet, Transaction
from dashboard.models import DashboardWidget, PlatformAnalytics, UserActivityLog
from dashboard.services import AnalyticsAggregator, ActivityLogger, WidgetService


class DashboardAppTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Admin User
        self.admin_user = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpassword123",
            first_name="Super",
            last_name="Admin"
        )

        # 2. Host User
        self.host_user = User.objects.create_user(
            email="host@example.com",
            password="hostpassword123",
            first_name="Alice",
            last_name="Host",
            role="host"
        )
        self.host_profile = self.host_user.host_profile
        self.host_profile.status = "online"
        self.host_profile.total_earnings = Decimal('50.00')
        self.host_profile.uptime_percentage = 99.5
        self.host_profile.reliability_score = 98
        self.host_profile.save()

        # 3. Renter User
        self.renter_user = User.objects.create_user(
            email="renter@example.com",
            password="renterpassword123",
            first_name="Bob",
            last_name="Renter",
            role="renter"
        )
        self.renter_wallet = self.renter_user.wallet
        self.renter_wallet.balance = Decimal('100.00')
        self.renter_wallet.save()

        # 4. GPU
        self.gpu = GPU.objects.create(
            host=self.host_profile,
            gpu_name="NVIDIA RTX 4090",
            vram_total="24576 MiB",
            vram_gb=24,
            price_per_hour=Decimal('2.50'),
            is_available=True,
            location="Dallas, TX"
        )

        # 5. Sessions
        self.active_session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='active',
            total_amount=15.00
        )

        self.completed_session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='completed',
            total_amount=30.00,
            actual_cost=30.00,
            duration_hours=12.0
        )

        # 6. Host Earning
        self.earning = HostEarning.objects.create(
            host=self.host_profile,
            session=self.completed_session,
            amount=Decimal('30.00'),
            platform_fee=Decimal('3.00'),
            net_amount=Decimal('27.00'),
            status='completed'
        )

        # 7. Wallet Transaction
        self.deposit_tx = Transaction.objects.create(
            user=self.renter_user,
            type='deposit',
            amount=Decimal('100.00'),
            status='completed',
            description='Initial deposit'
        )

    def test_dashboard_summary_renter(self):
        """GET /api/dashboard/summary/ for a renter"""
        self.client.force_authenticate(user=self.renter_user)
        url = reverse('dashboard:dashboard-summary')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['role'], 'renter')
        self.assertEqual(data['wallet']['balance'], 100.0)
        self.assertEqual(data['stats']['active_sessions'], 1)
        self.assertEqual(data['stats']['completed_sessions'], 1)
        self.assertEqual(data['stats']['total_spent'], 30.0)
        self.assertGreaterEqual(len(data['active_sessions']), 1)
        self.assertGreaterEqual(len(data['recent_sessions']), 1)

    def test_dashboard_summary_host(self):
        """GET /api/dashboard/summary/ for a host"""
        self.client.force_authenticate(user=self.host_user)
        url = reverse('dashboard:dashboard-summary')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['role'], 'host')
        self.assertEqual(data['stats']['total_earnings'], 50.0)
        self.assertEqual(data['stats']['total_gpus'], 1)
        self.assertEqual(data['stats']['active_sessions'], 1)
        self.assertGreaterEqual(len(data['gpus']), 1)

    def test_dashboard_summary_admin(self):
        """GET /api/dashboard/summary/ for an admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('dashboard:dashboard-summary')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['role'], 'admin')
        self.assertIn('platform_stats', data)
        self.assertGreaterEqual(data['platform_stats']['total_users'], 3)
        self.assertGreaterEqual(data['platform_stats']['total_gpus'], 1)

    def test_renter_dashboard_endpoint(self):
        """GET /api/dashboard/renter/"""
        self.client.force_authenticate(user=self.renter_user)
        url = reverse('dashboard:renter-dashboard')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'renter')
        self.assertEqual(response.data['wallet']['balance'], 100.0)

    def test_host_dashboard_endpoint(self):
        """GET /api/dashboard/host/"""
        self.client.force_authenticate(user=self.host_user)
        url = reverse('dashboard:host-dashboard')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'host')
        self.assertEqual(response.data['stats']['total_gpus'], 1)

    def test_platform_analytics_admin_access(self):
        """GET /api/dashboard/analytics/ - accessible by admin, forbidden for renter"""
        # Non-admin renter forbidden
        self.client.force_authenticate(user=self.renter_user)
        url = reverse('dashboard:platform-analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin access
        self.client.force_authenticate(user=self.admin_user)
        response_admin = self.client.get(url)
        self.assertEqual(response_admin.status_code, status.HTTP_200_OK)
        self.assertIn('overview', response_admin.data)
        self.assertIn('timeline', response_admin.data)
        self.assertGreaterEqual(response_admin.data['overview']['total_users'], 3)

    def test_revenue_analytics_admin_access(self):
        """GET /api/dashboard/revenue/ - accessible by admin, forbidden for renter"""
        self.client.force_authenticate(user=self.renter_user)
        url = reverse('dashboard:revenue-analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin_user)
        response_admin = self.client.get(url)
        self.assertEqual(response_admin.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response_admin.data)
        self.assertIn('timeline', response_admin.data)
        self.assertEqual(response_admin.data['summary']['gross_revenue'], 30.0)
        self.assertEqual(response_admin.data['summary']['platform_fees'], 3.0)
        self.assertEqual(response_admin.data['summary']['host_net_earnings'], 27.0)

    def test_activity_log_endpoint(self):
        """GET /api/dashboard/activity/"""
        # Create some activity logs
        ActivityLogger.log(user=self.renter_user, action='session_created', details={'test': True})
        ActivityLogger.log(user=self.host_user, action='gpu_registered', details={'test': True})

        # Renter sees only own logs
        self.client.force_authenticate(user=self.renter_user)
        url = reverse('dashboard:activity-log')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['user_email'], self.renter_user.email)

        # Admin sees all logs
        self.client.force_authenticate(user=self.admin_user)
        admin_resp = self.client.get(url)
        self.assertEqual(admin_resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(admin_resp.data['results']), 2)

    def test_dashboard_widgets_crud(self):
        """GET & POST /api/dashboard/widgets/ and /widgets/<id>/"""
        self.client.force_authenticate(user=self.renter_user)
        url = reverse('dashboard:widget-list-create')

        # 1. Listing triggers default widget creation
        list_resp = self.client.get(url)
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertGreater(len(list_resp.data), 0)

        # 2. Create custom widget
        post_resp = self.client.post(url, {
            'widget_type': 'system_metrics',
            'position': 10,
            'settings': {'refresh_rate': 30},
            'is_active': True
        }, format='json')
        self.assertEqual(post_resp.status_code, status.HTTP_201_CREATED)
        widget_id = post_resp.data['id']
        self.assertEqual(post_resp.data['widget_type'], 'system_metrics')

        # 3. Update widget
        detail_url = reverse('dashboard:widget-detail', kwargs={'widget_id': widget_id})
        patch_resp = self.client.patch(detail_url, {'position': 1}, format='json')
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_resp.data['position'], 1)

        # 4. Delete widget
        del_resp = self.client.delete(detail_url)
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DashboardWidget.objects.filter(id=widget_id).exists())

    def test_signals_integration(self):
        """Signals automatically create activity logs"""
        # Creating a new session should create a session_created log
        new_session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='starting',
            total_amount=5.00
        )
        self.assertTrue(
            UserActivityLog.objects.filter(
                user=self.renter_user,
                action='session_created'
            ).exists()
        )
