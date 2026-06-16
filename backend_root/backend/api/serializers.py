from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Advertisement

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = UserProfile
        fields = [
            'uuid',
            'username',
            'display_name',
            'email',
            'phone_number',
            'bio',
            'profile_picture',
            'created_at',
        ]
        read_only_fields = [
            'uuid',
            'username',
            'email',
            'created_at',
        ]

class PublicUserProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = UserProfile
        fields = [
            'display_name',
            'username',
            'bio',
            'profile_picture',
        ]

class AdvertisementSerializer(serializers.ModelSerializer):    
    posted_by = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    is_saved = serializers.BooleanField(read_only=True)
    save_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Advertisement
        fields = [
            'uuid',
            'title',
            'description',
            'salary',
            'type_of_salary',
            'work_time',
            'position_type',
            'address',
            'contact_email',
            'contact_phone',
            'image',
            'posted_by',
            'created_at',
            'updated_at',
            'is_owner',
            'is_saved',
            'save_count'
        ]
        read_only_fields = [
            'uuid',
            'posted_by',
            'created_at',
            'updated_at',
            'is_owner',
            'is_saved'
        ]
        
    def get_posted_by(self, obj):
        if hasattr(obj.posted_by, 'profile'):
            return PublicUserProfileSerializer(
                obj.posted_by.profile,
                context=self.context
            ).data
        return None

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.posted_by_id == request.user.id


class UserProfileRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    display_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'display_name'
        ]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def create(self, validated_data):
        display_name = validated_data.pop('display_name', None)

        user = User.objects.create_user(
            username = validated_data['username'],
            email = validated_data['email'],
            password = validated_data['password']
        )

        if display_name:
            user.profile.display_name = display_name
            user.profile.save()
        return user