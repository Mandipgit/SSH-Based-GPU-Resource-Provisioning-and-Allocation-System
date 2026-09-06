from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
import uuid

from .models import Notification
from .services import NotificationService
from .serializers import NotificationSerializer
from gpus.models import GPU
from users.models import HostProfile
from sessions.models import Session

User = get_user_model()


class NotificationModelTests(TestCase):
    """Test Notification database model functionality"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="notify_user@example.com",
            password="testpassword123",
            role="renter"
        )

    def test_notification_creation_and_defaults(self):
        notification = Notification.objects.create(
            user=self.user,
            type='welcome',
            title='Welcome!',
            message='Welcome to the platform.'
        )
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
        self.assertIn('welcome', str(notification))
        self.assertIn(self.user.email, str(notification))

    def test_mark_as_read_method(self):
        notification = Notification.objects.create(
            user=self.user,
            type='system_alert',
            title='Alert',
            message='System alert message'
        )
        self.assertFalse(notification.is_read)
        notification.mark_as_read()
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)


class NotificationServiceTests(TestCase):
    """Test all helper methods in NotificationService"""

    def setUp(self):
        self.renter = User.objects.create_user(
            email="renter_notify@example.com",
            password="testpassword123",
            role="renter"
        )
        self.host_user = User.objects.create_user(
            email="host_notify@example.com",
            password="testpassword123",
            role="host"
        )
        self.host_profile = getattr(self.host_user, 'host_profile', None) or HostProfile.objects.create(user=self.host_user)
        self.gpu = GPU.objects.create(
            host=self.host_profile,
            gpu_name="NVIDIA RTX 4090",
            vram_total="24GB",
            vram_gb=24,
            price_per_hour=Decimal("2.50")
        )
        self.session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter,
            status='active',
            relay_server_ip='127.0.0.1',
            relay_server_port=40001,
            ssh_connection_string="ssh renter@127.0.0.1 -p 40001",
            duration_hours=2.0,
            total_amount=5.0
        )

    def test_notify_session_started(self):
        notif = NotificationService.notify_session_started(self.session)
        self.assertEqual(notif.user, self.renter)
        self.assertEqual(notif.type, 'session_started')
        self.assertIn('active', notif.message)
        self.assertIn(str(self.session.id), notif.data.get('session_id'))

    def test_notify_session_ending(self):
        notif = NotificationService.notify_session_ending(self.session, minutes_remaining=15)
        self.assertEqual(notif.user, self.renter)
        self.assertEqual(notif.type, 'session_ending')
        self.assertEqual(notif.data.get('minutes_remaining'), 15)

    def test_notify_session_completed(self):
        notif = NotificationService.notify_session_completed(self.session)
        self.assertEqual(notif.user, self.renter)
        self.assertEqual(notif.type, 'session_completed')

    def test_notify_session_terminated(self):
        notif = NotificationService.notify_session_terminated(self.session, "Host went offline")
        self.assertEqual(notif.user, self.renter)
        self.assertEqual(notif.type, 'session_terminated')
        self.assertEqual(notif.data.get('reason'), "Host went offline")

    def test_notify_new_session_request(self):
        notif = NotificationService.notify_new_session_request(self.session)
        self.assertEqual(notif.user, self.host_user)
        self.assertEqual(notif.type, 'new_session_request')

    def test_payment_and_wallet_notifications(self):
        refund_notif = NotificationService.notify_refund_processed(self.renter, 12.50, str(self.session.id))
        self.assertEqual(refund_notif.type, 'refund_processed')
        self.assertEqual(refund_notif.data['amount'], 12.50)

        paid_notif = NotificationService.notify_payment_received(self.host_user, 20.00, str(self.session.id))
        self.assertEqual(paid_notif.type, 'payment_received')

        credit_notif = NotificationService.notify_wallet_credited(self.renter, 50.00, "Deposit via Stripe")
        self.assertEqual(credit_notif.type, 'wallet_credited')

        debit_notif = NotificationService.notify_wallet_debited(self.renter, 15.00, "Bank Withdrawal")
        self.assertEqual(debit_notif.type, 'wallet_debited')

    def test_host_and_general_notifications(self):
        offline_notif = NotificationService.notify_host_offline(self.renter, "Host-Alpha")
        self.assertEqual(offline_notif.type, 'host_offline')

        penalty_notif = NotificationService.notify_penalty_applied(self.host_user, 10, "Unexpected downtime")
        self.assertEqual(penalty_notif.type, 'penalty_applied')

        welcome_notif = NotificationService.notify_welcome(self.renter)
        self.assertEqual(welcome_notif.type, 'welcome')


class NotificationAPITests(TestCase):
    """Test all notification REST API endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            email="user1_notify@example.com",
            password="testpassword123",
            role="renter"
        )
        self.user2 = User.objects.create_user(
            email="user2_notify@example.com",
            password="testpassword123",
            role="renter"
        )

        # Create notifications for user1
        self.n1 = Notification.objects.create(
            user=self.user1,
            type='welcome',
            title='Welcome 1',
            message='First notification',
            is_read=False
        )
        self.n2 = Notification.objects.create(
            user=self.user1,
            type='session_started',
            title='Session Active',
            message='Second notification',
            is_read=True
        )

        # Create notification for user2
        self.n3 = Notification.objects.create(
            user=self.user2,
            type='welcome',
            title='Welcome 2',
            message='User2 notification',
            is_read=False
        )

    def test_unauthenticated_access_denied(self):
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_notifications_isolated_per_user(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['count'], 2)
        self.assertEqual(data['unread_count'], 1)
        ids = [item['id'] for item in data['data']]
        self.assertIn(str(self.n1.id), ids)
        self.assertIn(str(self.n2.id), ids)
        self.assertNotIn(str(self.n3.id), ids)

    def test_unread_count_endpoint(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/unread/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['unread_count'], 1)

    def test_mark_single_notification_read(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(f'/api/notifications/{self.n1.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.n1.refresh_from_db()
        self.assertTrue(self.n1.is_read)
        self.assertIsNotNone(self.n1.read_at)

    def test_mark_read_other_users_notification_fails(self):
        self.client.force_authenticate(user=self.user1)
        # Attempt to mark user2's notification
        response = self.client.patch(f'/api/notifications/{self.n3.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/notifications/read-all/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(user=self.user1, is_read=False).count(), 0)
        # Verify user2's notification is unaffected
        self.n3.refresh_from_db()
        self.assertFalse(self.n3.is_read)

    def test_delete_single_notification(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f'/api/notifications/{self.n1.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Notification.objects.filter(id=self.n1.id).exists())

    def test_delete_all_notifications(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete('/api/notifications/delete-all/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(user=self.user1).count(), 0)
        # user2 notifications still exist
        self.assertEqual(Notification.objects.filter(user=self.user2).count(), 1)


class NotificationSerializerTests(TestCase):
    """Test NotificationSerializer serialization and computed fields"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="serial_user@example.com",
            password="testpassword123",
            role="renter"
        )
        self.notification = Notification.objects.create(
            user=self.user,
            type='welcome',
            title='Welcome!',
            message='Test message',
            data={'sample_key': 'sample_value'}
        )

    def test_serializer_output_fields(self):
        serializer = NotificationSerializer(self.notification)
        data = serializer.data
        self.assertEqual(data['user_email'], self.user.email)
        self.assertEqual(data['type'], 'welcome')
        self.assertEqual(data['title'], 'Welcome!')
        self.assertEqual(data['time_ago'], 'Just now')
        self.assertEqual(data['data'], {'sample_key': 'sample_value'})
