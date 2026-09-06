from rest_framework import permissions

class IsWalletOwner(permissions.BasePermission):
    """Allow access only if user owns the wallet"""
    
    def has_object_permission(self,request, view, obj):
        return obj.user_id == request.user.id or request.user.is_admin
    
    
class CanManageWallet(permissions.BasePermission):
    """Allow access if user is admin or owner"""
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return obj.user_id == request.user.id
        