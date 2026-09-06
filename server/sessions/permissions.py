from rest_framework import permissions

class IsSessionOwner(permissions.BasePermission):
    """Allow access if user is the renter or host of the session"""
    def has_object_permission(self, request, view, obj):
        return (
            obj.renter_id == request.user.id or
            obj.host.user_id == request.user.id or
            request.user.is_admin
        )


class IsSessionRenter(permissions.BasePermission):
    """Allow access if user is the renter of the session"""
    def has_object_permission(self, request, view, obj):
        return obj.renter_id == request.user.id or request.user.is_admin


class IsSessionHost(permissions.BasePermission):
    """Allow access if user is the host of the session"""
    def has_object_permission(self, request, view, obj):
        return obj.host.user_id == request.user.id or request.user.is_admin


class IsHostWithSession(permissions.BasePermission):
    """Allow access if user is a host"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_host