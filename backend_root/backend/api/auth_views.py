from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import authenticate, get_user_model
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from .serializers import UserProfileRegistrationSerializer
from .models import EmailVerification, PasswordResetToken
from .mailing import send_link_email
import uuid
import logging


logger = logging.getLogger(__name__)


def frontend_url(path):
    return f"{settings.FRONTEND_BASE_URL.rstrip('/')}{path}"


def set_auth_cookies(response, refresh_token):
    cookie_secure = settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", False)
    cookie_samesite = settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax")
    cookie_path = settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH", "/")

    response.set_cookie(
        key="access_token",
        value=str(refresh_token.access_token),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path=cookie_path,
    )
    response.set_cookie(
        key="refresh_token",
        value=str(refresh_token),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path=cookie_path,
    )


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    return Response({"detail": "CSRF cookie set"})


@method_decorator(csrf_exempt, name="dispatch")
class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get("refresh_token")
        if not refresh:
            raise InvalidToken("No refresh token")

        request.data["refresh"] = refresh
        response = super().post(request, *args, **kwargs)

        access = response.data.get("access")
        if access:
            response.set_cookie(
                key="access_token",
                value=access,
                httponly=True,
                secure=settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", False),
                samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax"),
                path=settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH", "/"),
            )

        response.data = {}
        return response


@method_decorator(csrf_protect, name="dispatch")
class RegisterView(CreateAPIView):
    serializer_class = UserProfileRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_scope = "auth_register"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user = serializer.save()
            verification = EmailVerification.objects.create(user=user)

        verification_link = frontend_url(f"/verify-email/{verification.token}")
        try:
            send_link_email(
                subject="Verify your email.",
                recipient=user.email,
                intro="Click the button below to verify your email.",
                link_label="Verify email",
                link_url=verification_link,
            )
        except Exception:
            logger.exception("Failed to send registration verification email")
            return Response(
                {"detail": "Registration succeeded, but verification email could not be sent."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        refresh = RefreshToken.for_user(user)
        response = Response(status=status.HTTP_201_CREATED)
        set_auth_cookies(response, refresh)
        return response


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth_login"

    def post(self, request):
        user = authenticate(
            username=request.data.get("username"),
            password=request.data.get("password"),
        )

        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        verification = getattr(user, "email_verification", None)
        if not verification or not verification.is_verified:
            return Response(
                {"detail": "Email not verified"},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        response = Response(status=status.HTTP_200_OK)
        set_auth_cookies(response, refresh)
        return response


@method_decorator(csrf_protect, name="dispatch")
class LogOutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        cookie_samesite = settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax")
        cookie_path = settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH", "/")

        response = Response(status=204)
        response.delete_cookie(
            "refresh_token",
            path=cookie_path,
            samesite=cookie_samesite,
        )
        response.delete_cookie(
            "access_token",
            path=cookie_path,
            samesite=cookie_samesite,
        )
        return response


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        verification = get_object_or_404(EmailVerification, token=token)
        if verification.is_verified:
            return Response({"detail": "Email already verified."}, status=200)

        if verification.is_expired():
            return Response({"detail": "This verification link has expired."}, status=400)

        if verification.pending_email:
            verification.user.email = verification.pending_email
            verification.user.save(update_fields=["email"])

        verification.is_verified = True
        verification.is_used = True
        verification.pending_email = None
        verification.save()

        return Response({"detail": "Email verified successfully"}, status=200)


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth_verify_resend"

    def post(self, request):
        username = request.data.get("username")
        if not username:
            return Response({"detail": "Username required"}, status=400)

        User = get_user_model()
        user = get_object_or_404(User, username=username)

        verification, _ = EmailVerification.objects.get_or_create(user=user)
        if verification.is_verified:
            return Response({"detail": "Email already verified"}, status=400)

        verification.token = uuid.uuid4()
        verification.save()

        verification_link = frontend_url(f"/verify-email/{verification.token}")

        try:
            send_link_email(
                subject="Verify your email.",
                recipient=user.email,
                intro="Click the button below to verify your email.",
                link_label="Verify email",
                link_url=verification_link,
            )
        except Exception:
            logger.exception("Failed to resend verification email")
            return Response(
                {"detail": "Could not send verification email right now. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"detail": "Email verification sent"})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "password_reset_request"

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email required"}, status=400)

        User = get_user_model()
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "If the email exists, a reset link was sent."})

        reset = PasswordResetToken.objects.create(
            user=user,
            token=uuid.uuid4(),
            expires_at=timezone.now() + timezone.timedelta(minutes=30),
        )

        reset_link = frontend_url(f"/reset-password/{reset.token}")
        try:
            send_link_email(
                subject="Reset your password",
                recipient=user.email,
                intro="Click the button below to reset your password.",
                link_label="Reset password",
                link_url=reset_link,
            )
        except Exception:
            logger.exception("Failed to send password reset email")
        return Response({"detail": "If the email exists, a reset link was sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "password_reset_confirm"

    def post(self, request, token):
        password = request.data.get("password")

        if not token or not password:
            return Response({"detail": "Token and password required"}, status=400)

        reset = PasswordResetToken.objects.filter(token=token, used=False).first()
        if not reset:
            return Response({"detail": "Invalid reset link"}, status=400)

        if reset.is_expired():
            return Response({"detail": "Reset link expired"}, status=400)

        user = reset.user
        user.set_password(password)
        user.save()

        reset.used = True
        reset.save()

        return Response({"detail": "Password reset successful"})
