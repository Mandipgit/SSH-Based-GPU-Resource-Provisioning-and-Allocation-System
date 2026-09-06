# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, HostProfile, PasswordResetToken, EmailVerificationToken, LoginAttempt


class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'is_email_verified')
    list_filter = ('role', 'is_active', 'is_email_verified', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': (
                'role', 'is_active', 'is_staff', 'is_superuser',
                'is_email_verified', 'groups', 'user_permissions'
            )
        }),
        ('API Keys', {'fields': ('host_api_key',)}),
        ('Supabase', {'fields': ('supabase_user_id',)}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role'),
        }),
    )


class HostProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'gpu_name', 'status', 'uptime_percentage', 'total_sessions')
    list_filter = ('status',)
    search_fields = ('user__email', 'gpu_name')
    readonly_fields = ('created_at', 'updated_at')


class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used',)
    search_fields = ('user__email', 'token')


class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used',)
    search_fields = ('user__email', 'token')


admin.site.register(User, CustomUserAdmin)
admin.site.register(HostProfile, HostProfileAdmin)
admin.site.register(PasswordResetToken, PasswordResetTokenAdmin)
admin.site.register(EmailVerificationToken, EmailVerificationTokenAdmin)
admin.site.register(LoginAttempt)