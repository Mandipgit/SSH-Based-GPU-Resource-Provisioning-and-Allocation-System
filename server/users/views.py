# users/views.py
from rest_framework import generics, status, permissions, mixins, serializers
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
import logging
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer

from .models import User, HostProfile, PasswordResetToken
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    HostProfileSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ValidateApiKeySerializer,
)
from .permissions import IsHost, IsRenter, IsAdmin, IsHostOrAdmin
from .utils import create_password_reset_token, send_password_reset_email

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    POST: Register a new user.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Register new user account",
        description="Creates a new renter or host account with email, name, role, and password.",
        responses={
            201: inline_serializer(
                name='RegisterSuccessResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(),
                    'data': inline_serializer(
                        name='RegisterUserData',
                        fields={'user': UserSerializer()}
                    )
                }
            ),
            400: OpenApiResponse(description="Validation error (passwords don't match, email taken)")
        }
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'status': 'success',
            'message': 'User registered successfully. Please proceed to login.',
            'data': {
                'user': UserSerializer(user).data,
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    """
    User login endpoint.
    POST: Login and get JWT tokens.
    """
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="User login with JWT authentication",
        description="Authenticates with email and password, returning JWT access token, refresh token, and host profile details.",
        responses={
            200: inline_serializer(
                name='LoginSuccessResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField(),
                    'data': inline_serializer(
                        name='LoginSuccessData',
                        fields={
                            'user': UserSerializer(),
                            'host_profile': HostProfileSerializer(allow_null=True),
                            'access_token': serializers.CharField(),
                            'refresh_token': serializers.CharField()
                        }
                    )
                }
            ),
            400: OpenApiResponse(description="Invalid email or password")
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        refresh = RefreshToken.for_user(user)
        
        host_profile = None
        if user.is_host and hasattr(user, 'host_profile'):
            host_profile = HostProfileSerializer(user.host_profile).data
        
        return Response({
            'status': 'success',
            'message': 'Login successful',
            'data': {
                'user': UserSerializer(user).data,
                'host_profile': host_profile,
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
            }
        })


class LogoutView(generics.GenericAPIView):
    """
    User logout endpoint.
    POST: Blacklist refresh token.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="User logout",
        description="Blacklists JWT refresh token to revoke session.",
        request=inline_serializer(
            name='LogoutRequest',
            fields={'refresh_token': serializers.CharField()}
        ),
        responses={
            200: inline_serializer(
                name='LogoutResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField()
                }
            )
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'status': 'success',
                'message': 'Logged out successfully'
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(generics.GenericAPIView):
    """
    Refresh access token endpoint.
    POST: Get new access token using refresh token.
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Refresh JWT access token",
        description="Takes a valid refresh token and returns a fresh short-lived access token.",
        request=inline_serializer(
            name='RefreshTokenRequest',
            fields={'refresh_token': serializers.CharField()}
        ),
        responses={
            200: inline_serializer(
                name='RefreshTokenResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': inline_serializer(
                        name='RefreshTokenData',
                        fields={'access_token': serializers.CharField()}
                    )
                }
            ),
            401: OpenApiResponse(description="Invalid or expired refresh token")
        }
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({
                'status': 'error',
                'message': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'status': 'success',
                'data': {
                    'access_token': str(refresh.access_token),
                }
            })
        except Exception:
            return Response({
                'status': 'error',
                'message': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)


class MeView(generics.RetrieveUpdateAPIView):
    """
    Get and update current user profile.
    GET: Get user profile.
    PATCH/PUT: Update user profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Get logged-in user profile",
        description="Returns user details and host profile if applicable."
    )
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="Update logged-in user profile",
        description="Update first name or last name."
    )
    def patch(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = self.get_serializer(instance).data
        
        if instance.is_host and hasattr(instance, 'host_profile'):
            data['host_profile'] = HostProfileSerializer(instance.host_profile).data
        
        return Response({
            'status': 'success',
            'data': data
        })
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        
        allowed_fields = ['first_name', 'last_name']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'status': 'success',
            'data': serializer.data
        })


class ChangePasswordView(generics.GenericAPIView):
    """
    Change user password endpoint.
    POST: Change password with old password verification.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Change user password",
        description="Verifies old password and updates to new password.",
        responses={
            200: inline_serializer(
                name='ChangePasswordResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField()
                }
            ),
            400: OpenApiResponse(description="Incorrect old password or invalid new password")
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'status': 'error',
                'errors': {'old_password': 'Incorrect password'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'status': 'success',
            'message': 'Password changed successfully'
        })


class ForgotPasswordView(generics.GenericAPIView):
    """
    Request password reset endpoint.
    POST: Send password reset email.
    """
    serializer_class = ForgotPasswordSerializer
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Request password reset email",
        description="Sends a secure password reset token link to the user's registered email.",
        responses={
            200: inline_serializer(
                name='ForgotPasswordResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField()
                }
            )
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            reset_token = create_password_reset_token(user)
            send_password_reset_email(user, reset_token.token)
        except User.DoesNotExist:
            pass
        
        return Response({
            'status': 'success',
            'message': 'Password reset instructions sent to your email'
        })


class ResetPasswordView(generics.GenericAPIView):
    """
    Reset password endpoint.
    POST: Reset password using token.
    """
    serializer_class = ResetPasswordSerializer
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Reset password using token",
        description="Verifies the email reset token and sets the new password.",
        responses={
            200: inline_serializer(
                name='ResetPasswordResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'message': serializers.CharField()
                }
            ),
            400: OpenApiResponse(description="Invalid or expired reset token")
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            
            if not reset_token.is_valid():
                return Response({
                    'status': 'error',
                    'message': 'Invalid or expired token'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = reset_token.user
            user.set_password(new_password)
            user.save()
            
            reset_token.is_used = True
            reset_token.save()
            
            return Response({
                'status': 'success',
                'message': 'Password reset successfully'
            })
            
        except PasswordResetToken.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class GenerateHostApiKeyView(generics.GenericAPIView):
    """
    Generate host API key endpoint.
    POST: Generate new API key for host agent.
    """
    permission_classes = [IsHostOrAdmin]
    
    @extend_schema(
        summary="Generate Host API Key",
        description="Generates a unique API authentication key for the host's background daemon worker.",
        request=None,
        responses={
            200: inline_serializer(
                name='GenerateApiKeyResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': inline_serializer(
                        name='ApiKeyData',
                        fields={
                            'api_key': serializers.CharField(),
                            'message': serializers.CharField()
                        }
                    )
                }
            ),
            403: OpenApiResponse(description="User does not have host role")
        }
    )
    def post(self, request, *args, **kwargs):
        user = request.user
        
        if not user.is_host:
            return Response({
                'status': 'error',
                'message': 'User does not have host role'
            }, status=status.HTTP_403_FORBIDDEN)
        
        api_key = user.generate_host_api_key()
        
        return Response({
            'status': 'success',
            'data': {
                'api_key': api_key,
                'message': 'API key generated successfully. Store it securely.'
            }
        })


class ValidateHostApiKeyView(generics.GenericAPIView):
    """
    Validate host API key endpoint.
    POST: Validate API key for host agent.
    """
    serializer_class = ValidateApiKeySerializer
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Validate Host API Key",
        description="Used by host daemons to verify their API key and mark their node online.",
        responses={
            200: inline_serializer(
                name='ValidateApiKeyResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': inline_serializer(
                        name='ValidateApiKeyData',
                        fields={
                            'user_id': serializers.CharField(),
                            'email': serializers.CharField(),
                            'role': serializers.CharField(),
                            'is_host': serializers.BooleanField()
                        }
                    )
                }
            ),
            401: OpenApiResponse(description="Invalid API key")
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        api_key = serializer.validated_data['api_key']
        
        try:
            user = User.objects.get(host_api_key=api_key, is_active=True)
            
            if user.is_host and hasattr(user, 'host_profile'):
                user.host_profile.mark_online()
            
            return Response({
                'status': 'success',
                'data': {
                    'user_id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'is_host': user.is_host,
                }
            })
        except User.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Invalid API key'
            }, status=status.HTTP_401_UNAUTHORIZED)


class HostProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update host profile.
    GET: Get host profile.
    PATCH/PUT: Update host profile.
    """
    serializer_class = HostProfileSerializer
    permission_classes = [IsHostOrAdmin]
    
    @extend_schema(summary="Retrieve host node profile")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(summary="Update host node profile")
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    def get_object(self):
        return get_object_or_404(HostProfile, user=self.request.user)


class HostHeartbeatView(generics.GenericAPIView):
    """
    Host heartbeat endpoint.
    POST: Update host heartbeat and status.
    """
    permission_classes = [IsHostOrAdmin]
    
    @extend_schema(
        summary="Host node heartbeat ping",
        description="Host daemon pings to refresh uptime and node connectivity.",
        request=inline_serializer(
            name='HostHeartbeatRequest',
            fields={
                'gpu_name': serializers.CharField(required=False),
                'vram_total': serializers.CharField(required=False),
                'driver_version': serializers.CharField(required=False)
            }
        ),
        responses={
            200: inline_serializer(
                name='HostHeartbeatAck',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def post(self, request, *args, **kwargs):
        user = request.user
        
        if not user.is_host or not hasattr(user, 'host_profile'):
            return Response({
                'status': 'error',
                'message': 'User is not a host'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        host_profile = user.host_profile
        host_profile.update_heartbeat()
        
        if 'gpu_name' in request.data:
            host_profile.gpu_name = request.data['gpu_name']
        if 'vram_total' in request.data:
            host_profile.vram_total = request.data['vram_total']
        if 'driver_version' in request.data:
            host_profile.driver_version = request.data['driver_version']
        
        host_profile.save()
        
        return Response({
            'status': 'success',
            'data': {
                'host_id': str(host_profile.id),
                'status': host_profile.status,
                'last_heartbeat': host_profile.last_heartbeat,
                'uptime_percentage': host_profile.uptime_percentage,
            }
        })


class HostStatusView(generics.GenericAPIView):
    """
    Host status endpoint.
    GET: Get host status.
    POST: Update host online/offline status.
    """
    permission_classes = [IsHostOrAdmin]
    
    @extend_schema(
        summary="Get host node online status",
        description="Returns current status, uptime, and total sessions.",
        responses={
            200: inline_serializer(
                name='HostStatusDataResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def get(self, request, *args, **kwargs):
        user = request.user
        
        if not user.is_host or not hasattr(user, 'host_profile'):
            return Response({
                'status': 'error',
                'message': 'User is not a host'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        host_profile = user.host_profile
        
        return Response({
            'status': 'success',
            'data': {
                'host_id': str(host_profile.id),
                'status': host_profile.status,
                'is_online': host_profile.is_online(),
                'uptime_percentage': host_profile.uptime_percentage,
                'last_heartbeat': host_profile.last_heartbeat,
                'total_sessions': host_profile.total_sessions,
            }
        })
    
    @extend_schema(
        summary="Set host node online/offline manually",
        description="Allows host to toggle their status between online and offline.",
        request=inline_serializer(
            name='HostStatusToggleRequest',
            fields={'status': serializers.ChoiceField(choices=['online', 'offline'])}
        ),
        responses={
            200: inline_serializer(
                name='HostStatusToggleResponse',
                fields={
                    'status': serializers.CharField(default='success'),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def post(self, request, *args, **kwargs):
        user = request.user
        status_value = request.data.get('status')
        
        if not user.is_host or not hasattr(user, 'host_profile'):
            return Response({
                'status': 'error',
                'message': 'User is not a host'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if status_value not in ['online', 'offline']:
            return Response({
                'status': 'error',
                'message': 'Invalid status. Must be "online" or "offline"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        host_profile = user.host_profile
        
        if status_value == 'online':
            host_profile.mark_online()
        else:
            host_profile.mark_offline()
        
        return Response({
            'status': 'success',
            'data': {
                'host_id': str(host_profile.id),
                'status': host_profile.status,
            }
        })


class AdminUserListView(
    generics.GenericAPIView,
    mixins.ListModelMixin
):
    """
    List all users (admin only).
    GET: Get list of all users.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    
    @extend_schema(summary="Admin list all users")
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class AdminUserDetailView(
    generics.GenericAPIView,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin
):
    """
    Get, update, delete user (admin only).
    GET: Get user details.
    PATCH: Update user.
    DELETE: Deactivate user (soft delete).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'
    
    @extend_schema(summary="Admin retrieve user details")
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
    
    @extend_schema(summary="Admin update user details")
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
    
    @extend_schema(summary="Admin soft-delete user")
    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)
    
    def perform_destroy(self, instance):
        """Soft delete user by deactivating"""
        instance.is_active = False
        instance.save()