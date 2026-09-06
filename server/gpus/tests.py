from django.test import TestCase
from rest_framework.exceptions import ValidationError
from users.models import User, HostProfile
from gpus.models import GPU
from gpus.serializers import GPUSerializer, GPUCreateSerializer, GPUPriceSerializer

class GPUSerializersTestCase(TestCase):
    def setUp(self):
        # Create a host user
        self.user = User.objects.create_user(
            email="host@example.com",
            password="securepassword123",
            first_name="Host",
            last_name="User",
            role="host"
        )
        self.host_profile = self.user.host_profile
        self.host_profile.status = "online"
        self.host_profile.save()

        # Create a GPU instance
        self.gpu = GPU.objects.create(
            host=self.host_profile,
            gpu_name="NVIDIA RTX 4090",
            vram_total="24576 MiB",
            vram_gb=24,
            cuda_cores=16384,
            price_per_hour=2.50,
            is_available=True,
            location="Dallas, TX"
        )

    def test_gpu_serializer_success(self):
        serializer = GPUSerializer(instance=self.gpu)
        data = serializer.data
        self.assertEqual(data["gpu_name"], "NVIDIA RTX 4090")
        self.assertEqual(data["average_rating"], None)
        self.assertEqual(data["is_rentable"], True)

    def test_gpu_serializer_validation(self):
        # Invalid price_per_hour (must be > 0)
        data = {
            "gpu_name": "NVIDIA RTX 4090",
            "vram_total": "24576 MiB",
            "vram_gb": 24,
            "price_per_hour": 0.00,
            "location": "Dallas, TX"
        }
        serializer = GPUSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("price_per_hour", serializer.errors)

        # Invalid vram_gb
        data["price_per_hour"] = 2.50
        data["vram_gb"] = -1
        serializer = GPUSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("vram_gb", serializer.errors)

        data["vram_gb"] = 250
        serializer = GPUSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("vram_gb", serializer.errors)

    def test_gpu_create_serializer_validation(self):
        # Test creation serializer with invalid price
        data = {
            "gpu_name": "NVIDIA RTX 4090",
            "vram_total": "24576 MiB",
            "vram_gb": 24,
            "price_per_hour": -1.00,
            "location": "Dallas, TX"
        }
        serializer = GPUCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("price_per_hour", serializer.errors)

    def test_gpu_price_serializer_validation(self):
        # Test price serializer with valid and invalid values
        serializer = GPUPriceSerializer(data={"price_per_hour": 1.50})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["price_per_hour"], 1.50)

        serializer = GPUPriceSerializer(data={"price_per_hour": -0.50})
        self.assertFalse(serializer.is_valid())
        self.assertIn("price_per_hour", serializer.errors)
