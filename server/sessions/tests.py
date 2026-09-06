from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from gpus.models import GPU
from wallets.models import Wallet
from sessions.models import Session

User = get_user_model()

class SessionStopAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create host user
        self.host_user = User.objects.create_user(
            email="host@example.com",
            password="hostpassword123",
            first_name="Host",
            last_name="User",
            role="host"
        )
        self.host_profile = self.host_user.host_profile
        self.host_profile.status = "online"
        self.host_profile.save()
        
        # Create GPU
        self.gpu = GPU.objects.create(
            host=self.host_profile,
            gpu_name="NVIDIA RTX 4090",
            vram_total="24576 MiB",
            vram_gb=24,
            price_per_hour=2.00,
            is_available=False  # Active session makes it unavailable
        )
        
        # Create renter user
        self.renter_user = User.objects.create_user(
            email="renter@example.com",
            password="renterpassword123",
            first_name="Renter",
            last_name="User",
            role="renter"
        )
        self.client.force_authenticate(user=self.renter_user)
        
        # Ensure renter has a wallet with balance
        self.renter_wallet = self.renter_user.wallet
        self.renter_wallet.balance = 50.00
        self.renter_wallet.save()
        
        # Ensure host has a wallet
        self.host_wallet = self.host_user.wallet
        
        # Create active Session
        self.session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status="active",
            active_time=timezone.now() - timedelta(hours=2),  # 2 hours ago
            total_amount=10.00
        )
        
        # Set GPU current_session_id
        self.gpu.current_session_id = self.session.id
        self.gpu.save()
        
    def test_stop_session_success(self):
        """Test stopping an active session calculates billing and updates GPU statistics safely"""
        url = f"/api/sessions/{self.session.id}/stop/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        
        # Refresh session and GPU from DB
        self.session.refresh_from_db()
        self.gpu.refresh_from_db()
        
        self.assertEqual(self.session.status, "completed")
        self.assertEqual(self.session.termination_reason, "renter_stopped")
        
        # GPU stats should be updated without TypeError
        self.assertTrue(self.gpu.is_available)
        self.assertIsNone(self.gpu.current_session_id)
        
        # 2 hours used
        self.assertAlmostEqual(float(self.gpu.total_rental_hours), 2.0, places=2)
        # 2 hours * 2.00 per hour = 4.00 total cost/earnings
        self.assertAlmostEqual(float(self.gpu.total_earnings), 4.0, places=2)
        self.assertEqual(self.gpu.total_sessions, 1)
