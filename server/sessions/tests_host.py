from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
import uuid

from users.models import User, HostProfile
from gpus.models import GPU
from sessions.models import Session, HostEarning, HostPenaltyLog
from wallets.models import Wallet, Transaction
from sessions.services.billing import BillingService


class HostManagementTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Host User and auto-created Profile & Wallet
        self.host_user = User.objects.create_user(
            email='host@example.com',
            password='Password123!',
            first_name='Host',
            last_name='User',
            role='host'
        )
        self.host_profile = self.host_user.host_profile
        self.host_profile.gpu_name = 'NVIDIA RTX 4090'
        self.host_profile.vram_gb = 24
        self.host_profile.status = 'online'
        self.host_profile.uptime_percentage = 99.5
        self.host_profile.save()
        
        self.host_wallet = self.host_user.wallet
        self.host_wallet.balance = Decimal('100.00')
        self.host_wallet.save()
        
        # Renter User and auto-created Wallet
        self.renter_user = User.objects.create_user(
            email='renter@example.com',
            password='Password123!',
            first_name='Renter',
            last_name='User',
            role='renter'
        )
        self.renter_wallet = self.renter_user.wallet
        self.renter_wallet.balance = Decimal('500.00')
        self.renter_wallet.save()
        
        # Create GPU
        self.gpu = GPU.objects.create(
            host=self.host_profile,
            gpu_name='NVIDIA RTX 4090',
            vram_total='24576 MiB',
            vram_gb=24,
            price_per_hour=Decimal('50.00'),
            is_available=True
        )

    def test_host_settings_get_and_patch(self):
        self.client.force_authenticate(user=self.host_user)
        
        # GET settings
        response = self.client.get('/api/host/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertFalse(response.data['data']['auto_accept'])
        self.assertEqual(response.data['data']['max_rental_hours'], 24)
        
        # PATCH settings
        patch_payload = {
            'auto_accept': True,
            'max_rental_hours': 48,
            'notification_preferences': {'email': True, 'push': False},
            'availability_schedule': {'weekdays': '09:00-18:00'}
        }
        response = self.client.patch('/api/host/settings/', patch_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['auto_accept'])
        self.assertEqual(response.data['data']['max_rental_hours'], 48)
        
        # Verify db state
        self.host_profile.refresh_from_db()
        self.assertTrue(self.host_profile.auto_accept)
        self.assertEqual(self.host_profile.max_rental_hours, 48)
        self.assertEqual(self.host_profile.notification_preferences['email'], True)

    def test_host_auto_accept_toggle(self):
        self.client.force_authenticate(user=self.host_user)
        
        # Toggle auto-accept
        response = self.client.post('/api/host/auto-accept/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['auto_accept'])
        
        self.host_profile.refresh_from_db()
        self.assertTrue(self.host_profile.auto_accept)
        
        # Explicit set
        response = self.client.post('/api/host/auto-accept/', {'auto_accept': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['data']['auto_accept'])

    def test_host_dashboard_and_earnings(self):
        # Create session & earning
        session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='completed',
            total_amount=100.00,
            actual_cost=100.00,
            duration_hours=2.0,
            platform_fee=10.0,
            start_time=timezone.now() - timezone.timedelta(hours=2),
            active_time=timezone.now() - timezone.timedelta(hours=2),
            end_time=timezone.now()
        )
        HostEarning.objects.create(
            host=self.host_profile,
            session=session,
            amount=Decimal('100.00'),
            platform_fee=Decimal('10.00'),
            net_amount=Decimal('90.00'),
            status='completed',
            paid_at=timezone.now()
        )
        self.host_profile.update_earnings(net_amount=Decimal('90.00'), hours=2.0)
        self.gpu.update_stats(hours=2.0, earnings=Decimal('90.00'))
        
        self.client.force_authenticate(user=self.host_user)
        
        # Dashboard
        response = self.client.get('/api/host/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']
        self.assertEqual(data['stats']['total_sessions'], 1)
        self.assertEqual(data['stats']['completed_sessions'], 1)
        self.assertEqual(data['earnings']['total'], 90.0)
        self.assertEqual(data['earnings']['today'], 90.0)
        self.assertEqual(len(data['sessions_by_gpu']), 1)
        self.assertEqual(data['sessions_by_gpu'][0]['gpu_name'], 'NVIDIA RTX 4090')
        
        # Earnings list
        response = self.client.get('/api/host/earnings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['summary']['net_earnings'], 90.0)
        self.assertEqual(len(response.data['data']['history']), 1)
        
        # Earnings summary (charts)
        response = self.client.get('/api/host/earnings/summary/?days=7')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['total_net_in_period'], 90.0)

    def test_host_penalties_and_appeal(self):
        # Apply penalty
        penalty = self.host_profile.apply_penalty(points=15, reason='Unscheduled host node shutdown during rental')
        self.assertEqual(self.host_profile.penalty_points, 15)
        self.assertEqual(self.host_profile.reliability_score, 70)
        
        self.client.force_authenticate(user=self.host_user)
        
        # GET penalties
        response = self.client.get('/api/host/penalties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['penalty_points'], 15)
        self.assertEqual(len(response.data['data']['penalties']), 1)
        
        # Submit appeal
        appeal_url = f'/api/host/penalties/{penalty.id}/appeal/'
        response = self.client.post(appeal_url, {
            'appeal_reason': 'Power outage occurred in our area with official notification from electricity board.'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['appeal_status'], 'pending')
        
        penalty.refresh_from_db()
        self.assertEqual(penalty.appeal_status, 'pending')
        self.assertIsNotNone(penalty.appealed_at)

    def test_billing_service_host_earning_integration(self):
        # Create pending session and hold funds
        session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='active',
            total_amount=100.00,
            actual_cost=100.00,
            duration_hours=2.0,
            start_time=timezone.now() - timezone.timedelta(hours=2),
            active_time=timezone.now() - timezone.timedelta(hours=2)
        )
        self.renter_wallet.hold_funds(Decimal('100.00'))
        
        # Process payment via billing service
        result = BillingService.process_rental_payment(session)
        self.assertEqual(result['actual_cost'], 100.0)
        self.assertEqual(result['platform_fee'], 10.0)
        self.assertEqual(result['host_earnings'], 90.0)
        
        # Check HostEarning record
        earning = HostEarning.objects.get(session=session)
        self.assertEqual(earning.amount, Decimal('100.00'))
        self.assertEqual(earning.platform_fee, Decimal('10.00'))
        self.assertEqual(earning.net_amount, Decimal('90.00'))
        self.assertEqual(earning.status, 'completed')
        
        # Check host profile updated
        self.host_profile.refresh_from_db()
        self.assertEqual(self.host_profile.total_earnings, Decimal('90.00'))
        self.assertEqual(self.host_profile.total_sessions, 1)

    def test_host_activity_feed(self):
        # Create session
        Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='active',
            total_amount=50.00
        )
        self.client.force_authenticate(user=self.host_user)
        response = self.client.get('/api/host/activity/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['data']['activity']), 1)
