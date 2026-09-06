# notifications/services.py
from django.db import transaction
from django.utils import timezone
from .models import Notification


class NotificationService:
    """Service to create and send notifications"""
    
    @staticmethod
    def create_notification(user, type, title, message, data=None):
        if data is None:
            data = {}
        
        return Notification.objects.create(
            user=user,
            type=type,
            title=title,
            message=message,
            data=data
        )
    
    # ========================================
    # SESSION NOTIFICATIONS
    # ========================================
    
    @staticmethod
    def notify_session_started(session):
        return NotificationService.create_notification(
            user=session.renter,
            type='session_started',
            title='🎮 GPU Session Started',
            message=f'Your session with {session.gpu.gpu_name} is now active! SSH: {session.ssh_connection_string}',
            data={'session_id': str(session.id)}
        )
    
    @staticmethod
    def notify_session_ending(session, minutes_remaining):
        return NotificationService.create_notification(
            user=session.renter,
            type='session_ending',
            title='⚠️ Session Ending Soon',
            message=f'Your session with {session.gpu.gpu_name} will end in {minutes_remaining} minutes.',
            data={'session_id': str(session.id), 'minutes_remaining': minutes_remaining}
        )
    
    @staticmethod
    def notify_session_completed(session):
        return NotificationService.create_notification(
            user=session.renter,
            type='session_completed',
            title='✅ Session Completed',
            message=f'Your session with {session.gpu.gpu_name} completed successfully.',
            data={'session_id': str(session.id)}
        )
    
    @staticmethod
    def notify_session_terminated(session, reason):
        return NotificationService.create_notification(
            user=session.renter,
            type='session_terminated',
            title='⚠️ Session Terminated',
            message=f'Your session was terminated: {reason}',
            data={'session_id': str(session.id), 'reason': reason}
        )
    
    @staticmethod
    def notify_new_session_request(session):
        return NotificationService.create_notification(
            user=session.host.user,
            type='new_session_request',
            title='🆕 New Session Request',
            message=f'{session.renter.email} wants to rent your {session.gpu.gpu_name}',
            data={'session_id': str(session.id)}
        )
    
    # ========================================
    # PAYMENT NOTIFICATIONS
    # ========================================
    
    @staticmethod
    def notify_refund_processed(user, amount, session_id):
        return NotificationService.create_notification(
            user=user,
            type='refund_processed',
            title='💰 Refund Processed',
            message=f'Refund of ${amount:.2f} processed for session {session_id}',
            data={'amount': amount, 'session_id': session_id}
        )
    
    @staticmethod
    def notify_payment_received(host, amount, session_id):
        return NotificationService.create_notification(
            user=host,
            type='payment_received',
            title='💰 Payment Received',
            message=f'You received ${amount:.2f} from session {session_id}',
            data={'amount': amount, 'session_id': session_id}
        )
    
    @staticmethod
    def notify_wallet_credited(user, amount, description):
        return NotificationService.create_notification(
            user=user,
            type='wallet_credited',
            title='💰 Wallet Credited',
            message=f'${amount:.2f} added to your wallet: {description}',
            data={'amount': amount, 'description': description}
        )
    
    @staticmethod
    def notify_wallet_debited(user, amount, description):
        return NotificationService.create_notification(
            user=user,
            type='wallet_debited',
            title='💸 Wallet Debited',
            message=f'${amount:.2f} deducted from your wallet: {description}',
            data={'amount': amount, 'description': description}
        )
    
    # ========================================
    # HOST NOTIFICATIONS
    # ========================================
    
    @staticmethod
    def notify_host_offline(renter, host_name):
        return NotificationService.create_notification(
            user=renter,
            type='host_offline',
            title='⚠️ Host Offline',
            message=f'Host {host_name} went offline. Your session may be affected.',
            data={'host_name': host_name}
        )
    
    @staticmethod
    def notify_penalty_applied(host, penalty_points, reason):
        return NotificationService.create_notification(
            user=host,
            type='penalty_applied',
            title='⚠️ Penalty Applied',
            message=f'You received {penalty_points} penalty points: {reason}',
            data={'penalty_points': penalty_points, 'reason': reason}
        )
    
    # ========================================
    # REVIEW NOTIFICATIONS
    # ========================================
    
    @staticmethod
    def notify_review_received(host_user, review):
        return NotificationService.create_notification(
            user=host_user,
            type='review_received',
            title='⭐ New Review Received',
            message=f'You received a {review.rating}-star review for {review.gpu.gpu_name if review.gpu else "your GPU"}.',
            data={
                'review_id': str(review.id),
                'rating': review.rating,
                'session_id': str(review.session_id) if review.session_id else None
            }
        )

    @staticmethod
    def notify_review_response(renter_user, review):
        return NotificationService.create_notification(
            user=renter_user,
            type='review_response',
            title='💬 Host Responded to Your Review',
            message=f'Host responded to your review on {review.gpu.gpu_name if review.gpu else "their GPU"}.',
            data={
                'review_id': str(review.id),
                'session_id': str(review.session_id) if review.session_id else None
            }
        )

    # ========================================
    # GENERAL NOTIFICATIONS
    # ========================================
    
    @staticmethod
    def notify_welcome(user):
        return NotificationService.create_notification(
            user=user,
            type='welcome',
            title='👋 Welcome to our Platform!',
            message='Start renting GPUs or register your hardware to earn money.',
            data={}
        )

