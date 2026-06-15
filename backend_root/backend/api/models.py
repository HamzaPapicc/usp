from django.contrib.auth.models import User
from django.core.validators import RegexValidator, ValidationError
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from io import BytesIO
import os
from django.core.files.base import ContentFile
from PIL import Image, ImageOps

# Create your models here.

def generate_uuid():
    import uuid;
    return uuid.uuid4()

def val_pic_size(image):
    max_size = 5 * 1024 * 1024
    if image.size > max_size:
        raise ValidationError("Picture must be smaller than 5MB.")

def val_sal(salary):
    if salary < 0:
        raise ValidationError("Salary must be non negative.")


def normalize_uploaded_image(image_field, size, force=False):
    if not image_field:
        return False

    # Only normalize freshly uploaded files to avoid repeated recompression.
    if getattr(image_field, "_committed", True) and not force:
        return False

    if getattr(image_field, "_committed", True) and force:
        image_field.open("rb")

    image_field.file.seek(0)
    image = Image.open(image_field.file)
    original_format = (image.format or "JPEG").upper()
    image = ImageOps.exif_transpose(image)
    image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)

    if original_format not in {"JPEG", "JPG", "PNG", "WEBP"}:
        original_format = "JPEG"

    save_format = "JPEG" if original_format in {"JPEG", "JPG"} else original_format
    extension = "jpg" if save_format == "JPEG" else save_format.lower()

    if save_format == "JPEG":
        if image.mode in ("RGBA", "LA", "P"):
            image = image.convert("RGBA")
            background = Image.new("RGB", image.size, (255, 255, 255))
            alpha = image.split()[-1]
            background.paste(image, mask=alpha)
            image = background
        elif image.mode != "RGB":
            image = image.convert("RGB")

    output = BytesIO()
    if save_format == "JPEG":
        image.save(output, format=save_format, quality=88, optimize=True)
    elif save_format == "WEBP":
        image.save(output, format=save_format, quality=88, method=6)
    else:
        image.save(output, format=save_format, optimize=True)
    output.seek(0)

    base_name, _ = os.path.splitext(image_field.name)
    image_field.save(
        f"{base_name}.{extension}",
        ContentFile(output.read()),
        save=False
    )
    image_field.close()
    return True

class UserProfile(models.Model):
    uuid = models.UUIDField(primary_key=True ,default=generate_uuid, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the international format."
            )
        ]
    )
    display_name = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to = 'profiles/',
        blank=True,
        null=True,
        validators=[val_pic_size]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.display_name:
            self.display_name = self.user.username
        normalize_uploaded_image(self.profile_picture, (512, 512))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.display_name or self.user.username

class Advertisement(models.Model):
    POSITION_TYPE = [
        ('waiter', 'Waiter'),
        ('bartender', 'Bartender'),
        ('chef', 'Chef'),
        ('driver', 'Driver'),
        ('truck_driver', 'Truck driver'),
        ('cashier', 'Cashier'),
        ('delivery', 'Delivery'),
        ('warehouse_worker', 'Warehouse worker'),
        ('janitor', 'Janitor'),
    ]
    SALARY_TYPE = [
        ('monthly', 'Monthly'),
        ('daily', 'Daily'),
        ('hourly', 'Hourly'),
    ]
    uuid = models.UUIDField(primary_key=True, default=generate_uuid, editable=False)
    title = models.CharField(max_length=100, null=False)
    description = models.TextField(null=False)
    salary = models.DecimalField(max_digits=10, decimal_places=2, validators=[val_sal], db_index=True, null=False)
    type_of_salary = models.CharField(max_length=14, choices=SALARY_TYPE, default="monthly", null=False)
    work_time = models.CharField(max_length=20, null=False)
    position_type = models.CharField(max_length=30, choices=POSITION_TYPE, null=False, db_index=True)
    address = models.CharField(max_length=100, null=False)
    contact_email = models.EmailField(
        blank=True,
        default=""
    )
    contact_phone = models.CharField(
        max_length=15,
        blank=True,
        default="",
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the international format."
            )
        ]
    )
    image = models.ImageField(
        upload_to='ads/',
        blank=True,
        validators=[val_pic_size],
        null=True
    )
    posted_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="advertisements"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        # 16:9 banner output for card/header usage.
        normalize_uploaded_image(self.image, (1280, 720))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class SavedAdvertisement(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_ads"
    )
    advertisement = models.ForeignKey(
        "Advertisement",
        on_delete=models.CASCADE,
        related_name="saved_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'advertisement')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['advertisement']),
        ]

class AdvertisementReport(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ad_reports"
    )

    advertisement = models.ForeignKey(
        "Advertisement",
        on_delete=models.CASCADE,
        related_name="reports"
    )

    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'advertisement')
        indexes = [
            models.Index(fields=['status']),
        ]


class UserProfileReport(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile_reports_made"
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile_reports_received"
    )
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('reporter', 'reported_user')
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['reported_user']),
        ]

class EmailVerification(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_verification'
    )
    token = models.UUIDField(
        default=generate_uuid,
        unique=True,
        editable=False
    )
    pending_email = models.EmailField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    TOKEN_TTL = timedelta(hours=24)
    def is_expired(self):
        return timezone.now() > self.created_at + self.TOKEN_TTL

    def __str__(self):
        return f'{self.user.username} - verified={self.is_verified}'

class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_resets"
    )
    token = models.UUIDField(default=generate_uuid, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)

    def is_expired(self):
        return self.expires_at and timezone.now() > self.expires_at

    def __str__(self):
        return f"Password reset for {self.user.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=UserProfile)
def sync_missing_ad_contact_details(sender, instance, **kwargs):
    if instance.user.email:
        Advertisement.objects.filter(
            posted_by=instance.user,
            contact_email=""
        ).update(contact_email=instance.user.email)

    if instance.phone_number:
        Advertisement.objects.filter(
            posted_by=instance.user,
            contact_phone=""
        ).update(contact_phone=instance.phone_number)