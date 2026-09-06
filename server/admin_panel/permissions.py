from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Allow access only to admin users"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'is_admin', False) or getattr(request.user, 'role', '') == 'admin')
        )


class IsAdminOrStaff(permissions.BasePermission):
    """Allow access to admin and staff users"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'is_admin', False) or getattr(request.user, 'role', '') in ['admin', 'staff'])
        )