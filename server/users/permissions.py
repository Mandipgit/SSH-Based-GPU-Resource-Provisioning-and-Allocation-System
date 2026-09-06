# users/permissions.py
from rest_framework import permissions

class IsRenter(permissions.BasePermission):
    """Allow access only to renters"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_renter

class IsHost(permissions.BasePermission):
    """Allow access only to hosts"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_host

class IsAdmin(permissions.BasePermission):
    """Allow access only to admins"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin

class IsHostOrAdmin(permissions.BasePermission):
    """Allow access to hosts and admins"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.is_host or request.user.is_admin

class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow access if user is the owner or admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return obj.user_id == request.user.id or obj.id == request.user.id

class IsRenterOrAdmin(permissions.BasePermission):
    """Allow access to renters and admins"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.is_renter or request.user.is_admin