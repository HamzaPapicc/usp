from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .auth_views import (
    RegisterView,
    LoginView,
    csrf,
    VerifyEmailView,
    ResendVerificationView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)
from .views import (
    AdvertisementViewSet,
    UserProfileView,
    PublicUserProfileView,
    GlobalSearchView,
)

router = DefaultRouter()
router.register(
    r'advertisements',
    AdvertisementViewSet,
    basename='advertisement'
)

urlpatterns = [
    path('csrf/', csrf, name='csrf'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/verify-email/<uuid:token>/', VerifyEmailView.as_view()),
    path('auth/resend-verification/', ResendVerificationView.as_view()),
    path('auth/password-reset/request/', PasswordResetRequestView.as_view()),
    path('auth/password-reset/confirm/<uuid:token>', PasswordResetConfirmView.as_view()),
    path('profiles/<str:username>/', PublicUserProfileView.as_view(), name='public-profile'),
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('', include(router.urls))
]