from rest_framework import permissions

class IsHostWithGPU(permissions.BasePermission):
    """Allow access only if user is a host"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_host
    
    
class IsGPUOwner(permissions.BasePermission):
    """Allow access only if user owns the GPU"""
    
    def has_object_permission(self, request, view, obj):
        return obj.host.user_id == request.user.id or request.user.is_admin
    

class IsHostOrReadOnly(permissions.BasePermission):
    """Allow read-only for non-hosts, full access for hosts"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.is_authenticated and request.user.is_host
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return obj.host.user_id == request.user.id or request.user.is_admin