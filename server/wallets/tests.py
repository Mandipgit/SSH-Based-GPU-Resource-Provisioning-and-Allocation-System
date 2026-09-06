from django.test import TestCase
from django.contrib.auth import get_user_model
from wallets.models import Wallet
from users.serializers import UserSerializer

User = get_user_model()

class WalletAutoCreationTest(TestCase):
    def test_wallet_created_on_user_registration(self):
        """Test that a wallet is automatically created when a new user registers"""
        user = User.objects.create_user(
            email="new_renter@example.com",
            password="testpassword123",
            role="renter"
        )
        self.assertTrue(hasattr(user, 'wallet'))
        self.assertEqual(user.wallet.balance, 0.00)
        
    def test_wallet_created_on_existing_user_update(self):
        """Test that if an existing user somehow loses their wallet or didn't have one, it gets created on save/update"""
        user = User.objects.create_user(
            email="existing_user@example.com",
            password="testpassword123",
            role="renter"
        )
        
        # Manually delete wallet to simulate missing wallet
        user.wallet.delete()
        user.refresh_from_db()
        self.assertFalse(hasattr(user, 'wallet'))
        
        # Save user to trigger update signals
        user.save()
        
        # Wallet should be created again
        user.refresh_from_db()
        self.assertTrue(hasattr(user, 'wallet'))

    def test_serializer_returns_correct_wallet_balance(self):
        """Test that UserSerializer returns the actual wallet balance dynamically"""
        user = User.objects.create_user(
            email="wallet_balance_test@example.com",
            password="testpassword123",
            role="renter"
        )
        
        # Update balance
        user.wallet.balance = 150.50
        user.wallet.save()
        
        serializer = UserSerializer(user)
        self.assertEqual(serializer.data['wallet_balance'], 150.50)
