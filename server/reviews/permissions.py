from rest_framework import permissions


class IsReviewAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of a review to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.renter == request.user or request.user.is_staff


class IsReviewHost(permissions.BasePermission):
    """
    Custom permission to only allow the reviewed host to respond.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        host_profile = getattr(request.user, 'host_profile', None)
        return host_profile is not None and obj.host_id == host_profile.id
