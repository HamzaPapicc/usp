from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import BasePermission
from rest_framework.decorators import action
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Q, Exists, OuterRef, Value, BooleanField, Count
from django.conf import settings

from .models import UserProfile, Advertisement, EmailVerification, SavedAdvertisement, AdvertisementReport, UserProfileReport
from .filters import AdvertisementFilter
from .serializers import (
    AdvertisementSerializer,
    UserProfileSerializer,
    PublicUserProfileSerializer
)
from .authentication import CookieJWTAuthentication
from .permissions import IsEmailVerified
from .pagination import AdvertisementPagination
from .mailing import send_link_email

import uuid

# Create your views here.

class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.posted_by == request.user

class AdvertisementViewSet(ModelViewSet):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = AdvertisementSerializer
    pagination_class = AdvertisementPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AdvertisementFilter
    lookup_field = "uuid"
    search_fields = [
        'title',
        'description',
        'position_type',
    ]
    ordering_fields = [
        'created_at',
        'salary',
        'save_count'
    ]
    ordering = ['created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]

        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsEmailVerified(), IsOwner()]

        if self.action in ['save', 'report']:
            return [IsAuthenticated(), IsEmailVerified()]

        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Advertisement.objects.select_related(
            "posted_by",
            "posted_by__profile"
        ).annotate(
            save_count = Count('saved_by', distinct=True)
        )

        if self.request.user.is_authenticated:
            saved_subquery = SavedAdvertisement.objects.filter(
                user=self.request.user,
                advertisement=OuterRef('pk')
            )
            queryset = queryset.annotate(
                is_saved=Exists(saved_subquery)
            )
        else:
            queryset = queryset.annotate(
                is_saved=Value(False, output_field=BooleanField())
            )

        return queryset

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        contact_email = serializer.validated_data.get("contact_email") or self.request.user.email or ""
        contact_phone = serializer.validated_data.get("contact_phone") or (profile.phone_number if profile else "") or ""
        serializer.save(
            posted_by=self.request.user,
            contact_email=contact_email,
            contact_phone=contact_phone
        )

    def get_throttles(self):
        if self.action == "report":
            self.throttle_scope = "ad_report"
        return super().get_throttles()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def save(self, request, uuid=None):
        ad = self.get_object()

        existing = SavedAdvertisement.objects.filter(
            user=request.user,
            advertisement=ad
        )

        if ad.posted_by == request.user:
            return Response(
                {"detail": "You cannot save your own advertisement."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if existing.exists():
            existing.delete()
            return Response({"saved": False})

        SavedAdvertisement.objects.create(
            user=request.user,
            advertisement=ad
        )
        return Response({"saved": True})
        
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def report(self, request, uuid=None):
        ad = self.get_object()

        if ad.posted_by == request.user:
            return Response(
                {"detail": "You cannot report your own advertisement."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get("reason")
        if not reason:
            return Response(
                {"detail": "Reason is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        report, created = AdvertisementReport.objects.get_or_create(
            user=request.user,
            advertisement=ad,
            defaults={"reason": reason}
        )

        if not created:
            return Response(
                {"detail": "You have already reported this advertisement."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({"detail": "Report submitted."})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def saved(self, request):
        queryset = self.get_queryset().filter(
            saved_by__user=request.user
        ).distinct()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(
            user = self.request.user
        )
        return profile
    def patch(self, request, *args, **kwargs):
        new_email = request.data.get('email')
        if new_email and new_email != request.user.email:
            verification, _ = EmailVerification.objects.get_or_create(user=request.user)
            verification.pending_email = new_email
            verification.is_verified = False
            verification.token = uuid.uuid4()
            verification.save()
            verification_link = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/verify-email/{verification.token}"
            send_link_email(
                subject="Verify your email.",
                recipient=new_email,
                intro="Click the button below to verify your email.",
                link_label="Verify email",
                link_url=verification_link,
            )

        serializer = self.get_serializer(
            self.get_object(),
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'detail': 'Profile updated.'},
            status=status.HTTP_200_OK
        )

class PublicUserProfileView(APIView):
    permission_classes = [AllowAny]

    def get_throttles(self):
        if self.request.method.upper() == "POST":
            self.throttle_scope = "profile_report"
        return super().get_throttles()

    def get_permissions(self):
        if self.request.method.upper() == "POST":
            return [IsAuthenticated(), IsEmailVerified()]
        return [AllowAny()]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        profile = user.profile
        ads = Advertisement.objects.filter(posted_by=user)

        return Response({
            "profile": PublicUserProfileSerializer(profile).data,
            "advertisements": AdvertisementSerializer(ads, many=True).data
        })

    def post(self, request, username):
        user = get_object_or_404(User, username=username)

        if user == request.user:
            return Response(
                {"detail": "You cannot report your own profile."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get("reason")
        if not reason:
            return Response(
                {"detail": "Reason is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        report, created = UserProfileReport.objects.get_or_create(
            reporter=request.user,
            reported_user=user,
            defaults={"reason": reason}
        )

        if not created:
            return Response(
                {"detail": "You have already reported this profile."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"detail": "Profile report submitted."},
            status=status.HTTP_201_CREATED
        )

class GlobalSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', "").strip()

        if not query:
            return Response({
                'ads': [],
                'profiles': []
            })
        ads = Advertisement.objects.filter(
            Q(title__icontains = query) |
            Q(description__icontains = query) |
            Q(position_type__icontains = query)
        )
        profiles = UserProfile.objects.filter(
            Q(display_name__icontains = query) |
            Q(user__username__icontains = query)
        )

        return Response({
            'ads': AdvertisementSerializer(ads, many=True).data,
            'profiles': PublicUserProfileSerializer(profiles, many=True).data
        })

class CanDeleteOwnAccount(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active

class DeleteProfileView(APIView):
    permission_classes = [CanDeleteOwnAccount]

    def delete(self, request):
        request.user.delete()
        return Response(status=204)