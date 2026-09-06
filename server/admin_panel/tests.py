from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from users.models import User, HostProfile
from gpus.models import GPU
from sessions.models import Session, HostEarning
from wallets.models import Wallet, Transaction
from reviews.models import Review
from admin_panel.models import SystemSetting, SystemLog


class AdminPanelAppTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Admin User
        self.admin_user = User.objects.create_superuser(
            email="superadmin@example.com",
            password="adminpassword123",
            first_name="Admin",
            last_name="Boss"
        )

        # 2. Regular Host User
        self.host_user = User.objects.create_user(
            email="host_alice@example.com",
            password="password123",
            first_name="Alice",
            last_name="Host",
            role="host"
        )
        self.host_profile = self.host_user.host_profile
        self.host_profile.status = "online"
        self.host_profile.total_earnings = Decimal('100.00')
        self.host_profile.save()

        # 3. Regular Renter User
        self.renter_user = User.objects.create_user(
            email="renter_bob@example.com",
            password="password123",
            first_name="Bob",
            last_name="Renter",
            role="renter"
        )
        self.renter_wallet = self.renter_user.wallet
        self.renter_wallet.balance = Decimal('200.00')
        self.renter_wallet.save()

        # 4. GPU
        self.gpu = GPU.objects.create(
            host=self.host_profile,
            gpu_name="NVIDIA RTX 4090",
            vram_total="24576 MiB",
            vram_gb=24,
            price_per_hour=Decimal('3.00'),
            is_available=True,
            location="Dallas, TX"
        )

        # 5. Session
        self.session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='completed',
            total_amount=30.00,
            actual_cost=30.00,
            duration_hours=10.0
        )

        # 6. Host Earning
        self.earning = HostEarning.objects.create(
            host=self.host_profile,
            session=self.session,
            amount=Decimal('30.00'),
            platform_fee=Decimal('3.00'),
            net_amount=Decimal('27.00'),
            status='completed'
        )

        # 7. Rental Payment Transaction
        self.rental_tx = Transaction.objects.create(
            user=self.renter_user,
            type='rental_payment',
            amount=Decimal('-30.00'),
            status='completed',
            session_id=self.session.id,
            description=f'Rental payment for session {self.session.id}'
        )

        # 8. Review
        self.review = Review.objects.create(
            session=self.session,
            renter=self.renter_user,
            host=self.host_profile,
            gpu=self.gpu,
            rating=5,
            comment="Awesome host!"
        )

    def test_admin_dashboard_overview(self):
        """GET /api/admin/dashboard/ - success for admin, 403 for regular user"""
        # Regular user forbidden
        self.client.force_authenticate(user=self.renter_user)
        url = reverse('admin_panel:admin-dashboard')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # Admin access
        self.client.force_authenticate(user=self.admin_user)
        admin_resp = self.client.get(url)
        self.assertEqual(admin_resp.status_code, status.HTTP_200_OK)
        data = admin_resp.data['data']
        self.assertGreaterEqual(data['users']['total_users'], 3)
        self.assertGreaterEqual(data['gpus']['total_gpus'], 1)
        self.assertGreaterEqual(data['sessions']['total_sessions'], 1)
        self.assertGreaterEqual(data['financials']['total_revenue'], 30.0)

    def test_admin_user_management(self):
        """GET /api/admin/users/ and GET/PATCH/DELETE /api/admin/users/<id>/"""
        self.client.force_authenticate(user=self.admin_user)
        list_url = reverse('admin_panel:admin-users')
        resp = self.client.get(list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        detail_url = reverse('admin_panel:admin-user-detail', kwargs={'id': self.renter_user.id})
        detail_resp = self.client.get(detail_url)
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_resp.data['email'], self.renter_user.email)

        # Soft delete / deactivate
        del_resp = self.client.delete(detail_url)
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.renter_user.refresh_from_db()
        self.assertFalse(self.renter_user.is_active)

    def test_admin_host_management(self):
        """GET /api/admin/hosts/ and GET/PATCH /api/admin/hosts/<id>/"""
        self.client.force_authenticate(user=self.admin_user)
        list_url = reverse('admin_panel:admin-hosts')
        resp = self.client.get(list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        detail_url = reverse('admin_panel:admin-host-detail', kwargs={'id': self.host_profile.id})
        patch_resp = self.client.patch(detail_url, {'status': 'restricted'}, format='json')
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.host_profile.refresh_from_db()
        self.assertEqual(self.host_profile.status, 'restricted')

    def test_admin_session_management(self):
        """GET /api/admin/sessions/ and DELETE /api/admin/sessions/<id>/ terminates session"""
        self.client.force_authenticate(user=self.admin_user)
        list_url = reverse('admin_panel:admin-sessions')
        resp = self.client.get(list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Create active session to terminate
        active_sess = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='active',
            total_amount=15.00
        )
        detail_url = reverse('admin_panel:admin-session-detail', kwargs={'id': active_sess.id})
        del_resp = self.client.delete(detail_url)
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)
        active_sess.refresh_from_db()
        self.assertEqual(active_sess.status, 'terminated')
        self.assertEqual(active_sess.termination_reason, 'admin_cancelled')

    def test_admin_transaction_refund(self):
        """POST /api/admin/transactions/<id>/refund/ processes refund properly"""
        self.client.force_authenticate(user=self.admin_user)
        initial_balance = self.renter_user.wallet.balance

        refund_url = reverse('admin_panel:admin-transaction-refund', kwargs={'id': self.rental_tx.id})
        resp = self.client.post(refund_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Check wallet credited
        self.renter_user.wallet.refresh_from_db()
        self.assertEqual(self.renter_user.wallet.balance, initial_balance + Decimal('30.00'))

        # Check refund transaction created
        self.assertTrue(Transaction.objects.filter(type='refund', reference_id=str(self.rental_tx.id)).exists())

        # Second refund attempt on same tx is rejected
        dup_resp = self.client.post(refund_url)
        self.assertEqual(dup_resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_review_moderation(self):
        """PATCH /api/admin/reviews/<id>/moderate/ verifies/unverifies or deletes review"""
        self.client.force_authenticate(user=self.admin_user)
        mod_url = reverse('admin_panel:admin-review-moderate', kwargs={'id': self.review.id})

        # Unverify
        resp = self.client.patch(mod_url, {'action': 'unverify'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.review.refresh_from_db()
        self.assertFalse(self.review.is_verified)

        # Verify
        resp2 = self.client.patch(mod_url, {'action': 'verify'}, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.review.refresh_from_db()
        self.assertTrue(self.review.is_verified)

        # Delete
        resp3 = self.client.patch(mod_url, {'action': 'delete'}, format='json')
        self.assertEqual(resp3.status_code, status.HTTP_200_OK)
        self.assertFalse(Review.objects.filter(id=self.review.id).exists())

    def test_system_settings_and_logs(self):
        """CRUD on system settings and system logs"""
        self.client.force_authenticate(user=self.admin_user)

        # Create setting
        setting_url = reverse('admin_panel:admin-settings')
        resp = self.client.post(setting_url, {
            'key': 'platform_fee_percent',
            'value': {'percent': 10},
            'description': 'Platform commission fee percentage',
            'is_public': True
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        # Read setting detail
        detail_url = reverse('admin_panel:admin-setting-detail', kwargs={'key': 'platform_fee_percent'})
        get_resp = self.client.get(detail_url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(get_resp.data['key'], 'platform_fee_percent')

        # System Log listing & clearing
        SystemLog.objects.create(level='error', source='test_runner', message='Mock error log')
        logs_url = reverse('admin_panel:admin-logs')
        log_resp = self.client.get(logs_url)
        self.assertEqual(log_resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(log_resp.data['results']), 1)

        clear_url = reverse('admin_panel:admin-logs-clear')
        clear_resp = self.client.delete(clear_url)
        self.assertEqual(clear_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(SystemLog.objects.count(), 0)
