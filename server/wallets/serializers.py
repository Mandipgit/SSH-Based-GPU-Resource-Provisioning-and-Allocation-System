from rest_framework import serializers
from decimal import Decimal 
from .models import Wallet, Transaction


class WalletSerializer(serializers.ModelSerializer):
    available_balance = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    
    user_email = serializers.CharField(source= 'user.email', read_only = True)
    
    class Meta:
        model = Wallet
        fields = (
            'id', 'user', 'user_email', 'balance', 'hold_amount',
            'available_balance', 'currency', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
        
class TransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source = 'user.email', read_only= True)
    
    class Meta:
        model = Transaction
        fields = (
            'id', 'user', 'user_email', 'type', 'status', 'amount',
            'description', 'session_id', 'reference_id', 'metadata',
            'created_at', 'completed_at', 'updated_at'
        )
        
        read_only_fields = ('id', 'user', 'created_at', 'completed_at', 'updated_at')

class DepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    payment_method = serializers.CharField(max_length=50, required=False, default='stripe')
    payment_token = serializers.CharField(max_length=255, required=False, allow_blank=True)
    card_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    promo_code = serializers.CharField(max_length=50, required=False, allow_blank=True)



class WithdrawSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    bank_account = serializers.CharField(max_length=255, required=True)
    bank_name = serializers.CharField(max_length=255, required=True)
    account_holder_name = serializers.CharField(max_length=255, required=True)


class TransactionFilterSerializer(serializers.Serializer):
    type = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
    limit = serializers.IntegerField(required=False, default=20, min_value=1, max_value=100)
    offset = serializers.IntegerField(required=False, default=0, min_value=0)
