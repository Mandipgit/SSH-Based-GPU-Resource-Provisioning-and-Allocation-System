from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, HostProfile

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only = True,
        required = True,
        validators = [validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'password', 'password2')
        read_only_fields = ('id',)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2') 
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            email = validated_data['email'],
            password = password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'renter')
        )
        
        return user
        
class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required = True)
    password = serializers.CharField(required = True, write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                email=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('Invalid email or password')
            
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled')
            
            attrs['user'] = user
            return attrs
        
        raise serializers.ValidationError('Email and password are required')
    
    
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()
    is_host = serializers.SerializerMethodField()
    is_renter = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_email_verified',
            'wallet_balance', 'is_host', 'is_renter', 'created_at'
        )
        
        read_only_fields = ('created_at',)
    
    def get_full_name(self, obj):
        return obj.full_name
    
    def get_wallet_balance(self, obj):
        try:
            from wallets.models import Wallet
            wallet, _ = Wallet.objects.get_or_create(user=obj)
            return float(wallet.balance)
        except Exception:
            return 0.00
    
    def get_is_host(self, obj):
        return obj.is_host
    
    def get_is_renter(self, obj):
        return obj.is_renter
    
    
class HostProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = HostProfile
        fields = '__all__'
        read_only_fields = (
            'id', 'created_at', 'updated_at', 'user',
            'total_earnings', 'pending_payout', 'total_sessions',
            'total_rental_hours', 'reliability_score', 'penalty_points',
            'uptime_percentage', 'last_heartbeat', 'offline_since',
            'heartbeat_count'
        )
        
    def create(self, validated_data):
        user_id = validated_data.pop('user_id', None)
        if user_id:
            user = User.objects.get(id=user_id)
        else:
            user = self.context['request'].user
        return HostProfile.objects.create(user=user, **validated_data)
    

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return attrs
    
class HostApiKeySerializer(serializers.Serializer):
    api_key = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)


class ValidateApiKeySerializer(serializers.Serializer):
    api_key = serializers.CharField(required=True)   
    
    