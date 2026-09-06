from rest_framework import permissions


class IsRenter(permissions.BasePermission):
    """Allow access only to renters"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_renter', False))


class IsHost(permissions.BasePermission):
    """Allow access only to hosts"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_host', False))


class IsAdmin(permissions.BasePermission):
    """Allow access only to administrators"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'is_admin', False))
        )


class IsHostOrAdmin(permissions.BasePermission):
    """Allow access to hosts or admins"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            getattr(request.user, 'is_host', False) or
            request.user.is_staff or
            request.user.is_superuser or
            getattr(request.user, 'is_admin', False)
        )


class IsRenterOrAdmin(permissions.BasePermission):
    """Allow access to renters or admins"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            getattr(request.user, 'is_renter', False) or
            request.user.is_staff or
            request.user.is_superuser or
            getattr(request.user, 'is_admin', False)
        )
