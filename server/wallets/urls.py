# wallets/urls.py
from django.urls import path
from . import views

app_name = 'wallets'

urlpatterns = [
    # Wallet
    path('', views.WalletView.as_view(), name='wallet'),
    path('balance/', views.WalletBalanceView.as_view(), name='balance'),
    
    # Deposits & Withdrawals
    path('deposit/', views.DepositView.as_view(), name='deposit'),
    path('deposit/confirm/', views.ConfirmPaymentView.as_view(), name='deposit-confirm'),
    path('webhook/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('withdraw/', views.WithdrawView.as_view(), name='withdraw'),
    
    # Transactions
    path('transactions/', views.TransactionListView.as_view(), name='transactions'),
    path('transactions/<uuid:pk>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
]