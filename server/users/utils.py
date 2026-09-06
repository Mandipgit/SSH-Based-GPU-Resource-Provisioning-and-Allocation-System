from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import secrets
from .models import PasswordResetToken, EmailVerificationToken


def generate_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(64)


def create_password_reset_token(user):
    """Create a password reset token for user"""
    token = generate_token()
    expires_at = timezone.now() + timedelta(hours=24)
    
    reset_token = PasswordResetToken.objects.create(
        user=user,
        token=token,
        expires_at=expires_at
    )
    
    return reset_token


def create_email_verification_token(user):
    """Create an email verification token for user"""
    token = generate_token()
    expires_at = timezone.now() + timedelta(days=7)
    
    verify_token = EmailVerificationToken.objects.create(
        user=user,
        token=token,
        expires_at=expires_at
    )
    
    return verify_token


def send_password_reset_email(user, token):
    """Send password reset email"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    platform_name = getattr(settings, 'PLATFORM_NAME', 'GPU Rental Platform')
    subject = 'Password Reset Request'
    message = f"""
    Hello {user.full_name},
    
    You requested a password reset for your account.
    
    Click the link below to reset your password:
    {reset_url}
    
    This link will expire in 24 hours.
    
    If you didn't request this, please ignore this email.
    
    Thanks,
    {platform_name} Team
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


def send_email_verification_email(user, token):
    """Send email verification email"""
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    platform_name = getattr(settings, 'PLATFORM_NAME', 'GPU Rental Platform')
    
    subject = 'Verify Your Email Address'
    message = f"""
    Hello {user.full_name},
    
    Please verify your email address to complete registration.
    
    Click the link below to verify your email:
    {verify_url}
    
    This link will expire in 7 days.
    
    Thanks,
    {platform_name} Team
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )