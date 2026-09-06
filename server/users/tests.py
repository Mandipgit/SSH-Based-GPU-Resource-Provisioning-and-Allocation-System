from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


class UserAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.me_url = '/api/auth/me/'

    def test_user_registration_success(self):
        """Test registering a new user creates account and auto-provisions wallet"""
        payload = {
            'email': 'testrenter@example.com',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
            'first_name': 'Test',
            'last_name': 'Renter',
            'role': 'renter'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['data']['user']['email'], 'testrenter@example.com')
        self.assertTrue(User.objects.filter(email='testrenter@example.com').exists())

    def test_user_registration_password_mismatch(self):
        """Test registration fails when password and password2 do not match"""
        payload = {
            'email': 'mismatch@example.com',
            'password': 'StrongPassword123!',
            'password2': 'DifferentPassword123!',
            'role': 'renter'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, 400)

    def test_user_login_success(self):
        """Test login returns JWT access and refresh tokens"""
        user = User.objects.create_user(
            email='loginuser@example.com',
            password='TestPassword123!',
            role='renter'
        )
        response = self.client.post(self.login_url, {
            'email': 'loginuser@example.com',
            'password': 'TestPassword123!'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.data['data'])
        self.assertIn('refresh_token', response.data['data'])

    def test_get_current_user_profile(self):
        """Test GET /api/auth/me returns authenticated user details"""
        user = User.objects.create_user(
            email='profileuser@example.com',
            password='TestPassword123!',
            role='renter'
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['email'], 'profileuser@example.com')
        self.assertEqual(response.data['data']['wallet_balance'], 0.0)


class HostApiKeyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.host_user = User.objects.create_user(
            email='hostuser@example.com',
            password='TestPassword123!',
            role='host'
        )
        self.client.force_authenticate(user=self.host_user)

    def test_generate_and_validate_host_api_key(self):
        """Test host can generate an API key and validate it"""
        gen_res = self.client.post('/api/auth/host/api-key/')
        self.assertEqual(gen_res.status_code, 200)
        api_key = gen_res.data['data']['api_key']
        self.assertTrue(bool(api_key))

        # Validate the API key
        val_res = self.client.post('/api/auth/host/api-key/validate/', {'api_key': api_key}, format='json')
        self.assertEqual(val_res.status_code, 200)
        self.assertEqual(val_res.data['status'], 'success')
        self.assertEqual(val_res.data['data']['email'], 'hostuser@example.com')
        self.assertTrue(val_res.data['data']['is_host'])

