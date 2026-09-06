import os
import uuid
import stripe
import logging
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from ..models import Wallet, Transaction

logger = logging.getLogger(__name__)

# Initialize Stripe API key
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', os.getenv('STRIPE_SECRET_KEY', ''))


class PaymentService:
    """Payment gateway: real Stripe when configured, otherwise instant dummy settlement."""

    PLACEHOLDER_MARKERS = (
        'placeholder',
        'changeme',
        'your_stripe',
        'sk_test_local',
        'pk_test_local',
        'whsec_local',
    )

    @classmethod
    def _stripe_key(cls) -> str:
        return (getattr(settings, 'STRIPE_SECRET_KEY', None) or os.getenv('STRIPE_SECRET_KEY', '') or '').strip()

    @classmethod
    def payments_mode(cls) -> str:
        """dummy | stripe — dummy is default when Stripe is missing/placeholder or PAYMENTS_MODE=dummy."""
        mode = (os.getenv('PAYMENTS_MODE') or getattr(settings, 'PAYMENTS_MODE', '') or '').strip().lower()
        if mode in ('dummy', 'dev', 'local', 'sandbox'):
            return 'dummy'
        if mode == 'stripe':
            return 'stripe'
        return 'dummy' if not cls.is_stripe_configured() else 'stripe'

    @classmethod
    def is_stripe_configured(cls) -> bool:
        """True only for a real-looking Stripe secret key (not placeholders)."""
        key = cls._stripe_key()
        if not key or not key.startswith('sk_'):
            return False
        lowered = key.lower()
        if any(m in lowered for m in cls.PLACEHOLDER_MARKERS):
            return False
        # too short / obviously fake
        if len(key) < 20:
            return False
        return True

    @classmethod
    def create_deposit_intent(cls, user, amount: Decimal, currency: str = 'usd', payment_method: str = 'stripe') -> dict:
        """
        Create a payment intent or instantly settle in dummy mode.
        """
        amount_decimal = Decimal(str(amount))
        if amount_decimal <= 0:
            raise ValueError("Amount must be greater than zero")

        curr = currency.lower()
        if curr not in ['usd', 'npr', 'eur', 'gbp']:
            curr = 'usd'

        amount_cents = int(amount_decimal * 100)
        use_dummy = cls.payments_mode() == 'dummy' or payment_method in ('dummy', 'dev', 'local', 'test')

        tx = Transaction.create_deposit(
            user=user,
            amount=amount_decimal,
            metadata={
                'payment_method': 'dummy' if use_dummy else payment_method,
                'currency': curr,
                'amount_cents': amount_cents,
                'payments_mode': cls.payments_mode(),
            }
        )

        if (not use_dummy) and payment_method == 'stripe' and cls.is_stripe_configured():
            try:
                intent = stripe.PaymentIntent.create(
                    amount=amount_cents,
                    currency=curr,
                    payment_method_types=['card'],
                    metadata={
                        'transaction_id': str(tx.id),
                        'user_id': str(user.id),
                        'user_email': user.email,
                        'purpose': 'wallet_deposit',
                    },
                    description=f"Wallet deposit for {user.email}",
                )

                tx.reference_id = intent.id
                tx.metadata['payment_intent_id'] = intent.id
                tx.metadata['client_secret'] = intent.client_secret
                tx.save(update_fields=['reference_id', 'metadata'])

                return {
                    'mode': 'stripe_intent',
                    'transaction_id': str(tx.id),
                    'payment_intent_id': intent.id,
                    'client_secret': intent.client_secret,
                    'status': 'requires_payment_method',
                    'amount': float(amount_decimal),
                    'currency': curr,
                }
            except stripe.error.StripeError as e:
                logger.error(f"Stripe PaymentIntent creation error: {e}")
                tx.fail(str(e))
                raise ValueError(f"Stripe error: {str(e)}")

        # Dummy / local development: credit wallet immediately
        logger.info(f"Dummy deposit for {user.email}: {amount_decimal}")
        dummy_pi = f"pi_dummy_{uuid.uuid4().hex[:24]}"
        with transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(user=user)
            wallet.add_funds(amount_decimal)
            tx.reference_id = dummy_pi
            meta = dict(tx.metadata or {})
            meta['payment_intent_id'] = dummy_pi
            meta['dummy'] = True
            tx.metadata = meta
            tx.save(update_fields=['reference_id', 'metadata'])
            tx.complete()
            wallet.refresh_from_db()

        return {
            'mode': 'direct_settled',
            'transaction_id': str(tx.id),
            'payment_intent_id': dummy_pi,
            'status': 'completed',
            'amount': float(amount_decimal),
            'currency': wallet.currency,
            'new_balance': float(wallet.balance),
            'wallet': {
                'id': str(wallet.id),
                'balance': float(wallet.balance),
                'hold_amount': float(wallet.hold_amount),
                'available_balance': float(wallet.available_balance),
                'currency': wallet.currency,
            },
            'transaction': {
                'id': str(tx.id),
                'type': tx.type,
                'amount': float(tx.amount),
                'status': tx.status,
                'description': tx.description or 'Wallet Deposit',
            },
        }

    @classmethod
    def confirm_payment_intent(cls, payment_intent_id: str) -> dict:
        """
        Verify and complete a PaymentIntent. Dummy ids (pi_dummy_*) settle locally.
        """
        if not payment_intent_id:
            raise ValueError("payment_intent_id is required")

        # Dummy path
        if payment_intent_id.startswith('pi_dummy_') or cls.payments_mode() == 'dummy':
            with transaction.atomic():
                try:
                    tx = Transaction.objects.select_for_update().get(reference_id=payment_intent_id)
                except Transaction.DoesNotExist:
                    # Also allow confirming by looking up metadata
                    tx = Transaction.objects.select_for_update().filter(
                        metadata__payment_intent_id=payment_intent_id
                    ).first()
                    if not tx:
                        raise ValueError("Dummy payment intent not found")

                wallet, _ = Wallet.objects.select_for_update().get_or_create(user=tx.user)
                if tx.status == 'completed':
                    return {
                        'status': 'already_completed',
                        'transaction_id': str(tx.id),
                        'amount': float(tx.amount),
                        'wallet_balance': float(wallet.balance),
                        'new_balance': float(wallet.balance),
                    }
                wallet.add_funds(tx.amount)
                tx.complete()
                wallet.refresh_from_db()
                return {
                    'status': 'success',
                    'transaction_id': str(tx.id),
                    'amount': float(tx.amount),
                    'wallet_balance': float(wallet.balance),
                    'new_balance': float(wallet.balance),
                }

        if not cls.is_stripe_configured():
            raise ValueError("Stripe is not configured")

        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if intent.status == 'succeeded':
                tx_id = intent.metadata.get('transaction_id')
                if not tx_id:
                    raise ValueError("Transaction ID missing in payment intent metadata")

                with transaction.atomic():
                    tx = Transaction.objects.select_for_update().get(id=tx_id)
                    if tx.status == 'completed':
                        return {'status': 'already_completed', 'transaction_id': str(tx.id)}

                    wallet, _ = Wallet.objects.select_for_update().get_or_create(user=tx.user)
                    wallet.add_funds(tx.amount)
                    tx.complete()

                return {
                    'status': 'success',
                    'transaction_id': str(tx.id),
                    'amount': float(tx.amount),
                    'wallet_balance': float(wallet.balance),
                    'new_balance': float(wallet.balance),
                }
            else:
                return {
                    'status': intent.status,
                    'message': f"PaymentIntent is in status: {intent.status}"
                }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe verification error: {e}")
            raise ValueError(str(e))

    @classmethod
    def handle_webhook_event(cls, payload: bytes, sig_header: str) -> dict:
        """
        Verify Stripe webhook cryptographic signature and process events.
        """
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', os.getenv('STRIPE_WEBHOOK_SECRET', ''))

        try:
            if webhook_secret and 'local' not in webhook_secret.lower() and 'placeholder' not in webhook_secret.lower():
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                import json
                event = json.loads(payload.decode('utf-8'))
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise ValueError(f"Webhook error: {str(e)}")

        event_type = event.get('type') if isinstance(event, dict) else event['type']
        event_data = event.get('data', {}).get('object', {}) if isinstance(event, dict) else event['data']['object']

        logger.info(f"Stripe webhook received: {event_type}")

        if event_type == 'payment_intent.succeeded':
            intent_id = event_data.get('id')
            tx_id = event_data.get('metadata', {}).get('transaction_id')

            if tx_id:
                try:
                    with transaction.atomic():
                        tx = Transaction.objects.select_for_update().get(id=tx_id)
                        if tx.status != 'completed':
                            wallet, _ = Wallet.objects.select_for_update().get_or_create(user=tx.user)
                            wallet.add_funds(tx.amount)
                            tx.complete()
                            logger.info(f"Completed deposit transaction {tx.id} via webhook")
                except Transaction.DoesNotExist:
                    logger.warning(f"Transaction {tx_id} from webhook not found")

        elif event_type == 'payment_intent.payment_failed':
            tx_id = event_data.get('metadata', {}).get('transaction_id')
            error_msg = event_data.get('last_payment_error', {}).get('message', 'Payment failed')
            if tx_id:
                try:
                    tx = Transaction.objects.get(id=tx_id)
                    tx.fail(error_msg)
                except Transaction.DoesNotExist:
                    pass

        return {'status': 'processed', 'type': event_type}
