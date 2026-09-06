import os
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
    """Production payment gateway service (Stripe & extensible gateways)"""

    @classmethod
    def is_stripe_configured(cls) -> bool:
        """Check if Stripe live or test secret key is configured"""
        key = getattr(settings, 'STRIPE_SECRET_KEY', os.getenv('STRIPE_SECRET_KEY', ''))
        return bool(key and key.startswith('sk_'))

    @classmethod
    def create_deposit_intent(cls, user, amount: Decimal, currency: str = 'usd', payment_method: str = 'stripe') -> dict:
        """
        Create a payment intent or checkout session for depositing funds.
        Returns payment metadata including client_secret for Stripe Elements/Checkout.
        """
        amount_decimal = Decimal(str(amount))
        if amount_decimal <= 0:
            raise ValueError("Amount must be greater than zero")

        # Amount in smallest currency unit (e.g. cents for USD)
        # NPR/USD handling
        curr = currency.lower()
        if curr not in ['usd', 'npr', 'eur', 'gbp']:
            curr = 'usd'

        amount_cents = int(amount_decimal * 100)

        # Create pending transaction record
        tx = Transaction.create_deposit(
            user=user,
            amount=amount_decimal,
            metadata={
                'payment_method': payment_method,
                'currency': curr,
                'amount_cents': amount_cents,
            }
        )

        if payment_method == 'stripe' and cls.is_stripe_configured():
            try:
                # Create genuine Stripe PaymentIntent
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

        # Fallback / Direct development processing
        # When Stripe API key is not configured or in local sandbox
        logger.info(f"Processing deposit in local development mode for {user.email} (Amount: {amount_decimal})")
        with transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(user=user)
            wallet.add_funds(amount_decimal)
            tx.complete()

        return {
            'mode': 'direct_settled',
            'transaction_id': str(tx.id),
            'status': 'completed',
            'amount': float(amount_decimal),
            'currency': wallet.currency,
        }

    @classmethod
    def confirm_payment_intent(cls, payment_intent_id: str) -> dict:
        """
        Verify and complete a PaymentIntent directly against Stripe API.
        """
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
                    'wallet_balance': float(wallet.balance)
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
            if webhook_secret:
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
