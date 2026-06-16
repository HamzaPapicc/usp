from rest_framework.permissions import BasePermission

class IsEmailVerified(BasePermission):
    def has_permission(self, request, view):
        verification = getattr(request.user, 'email_verification', None)
        return verification and verification.is_verified