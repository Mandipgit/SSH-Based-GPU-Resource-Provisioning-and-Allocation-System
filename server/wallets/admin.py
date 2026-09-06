# wallets/admin.py
from django.contrib import admin
from .models import Wallet, Transaction


class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'hold_amount', 'available_balance', 'currency')
    list_filter = ('currency',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Balance', {'fields': ('balance', 'hold_amount', 'currency')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'amount', 'status', 'created_at')
    list_filter = ('type', 'status')
    search_fields = ('user__email', 'description', 'reference_id')
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Transaction', {'fields': ('type', 'amount', 'status')}),
        ('Details', {'fields': ('description', 'session_id', 'reference_id')}),
        ('Metadata', {'fields': ('metadata',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'completed_at')}),
    )


admin.site.register(Wallet, WalletAdmin)
admin.site.register(Transaction, TransactionAdmin)