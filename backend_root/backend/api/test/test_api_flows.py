from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from api.models import (
    Advertisement,
    AdvertisementReport,
    EmailVerification,
    SavedAdvertisement,
    UserProfileReport,
)


class APICoreFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def create_user(self, username, email=None, password="Password123!"):
        email = email or f"{username}@example.com"
        return User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

    def verify_user_email(self, user):
        verification, _ = EmailVerification.objects.get_or_create(user=user)
        verification.is_verified = True
        verification.is_used = True
        verification.save(update_fields=["is_verified", "is_used"])
        return verification

    def create_ad(self, owner, **overrides):
        data = {
            "title": "Test ad",
            "description": "Ad description",
            "salary": Decimal("1000.00"),
            "type_of_salary": "monthly",
            "work_time": "09:00-17:00",
            "position_type": "waiter",
            "address": "Main street 1",
            "contact_email": owner.email,
            "contact_phone": "+381611234567",
            "posted_by": owner,
        }
        data.update(overrides)
        return Advertisement.objects.create(**data)

    def test_register_creates_user_profile_and_verification(self):
        payload = {
            "username": "register_user",
            "email": "register_user@example.com",
            "password": "Password123!",
            "display_name": "Register User",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="register_user")
        self.assertEqual(user.profile.display_name, "Register User")
        self.assertTrue(EmailVerification.objects.filter(user=user).exists())
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)

    def test_login_requires_verified_email(self):
        user = self.create_user("no_verify_user")

        response = self.client.post(
            "/api/auth/login/",
            {"username": user.username, "password": "Password123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["detail"], "Email not verified")

    def test_login_succeeds_with_verified_email(self):
        user = self.create_user("verified_user")
        self.verify_user_email(user)

        response = self.client.post(
            "/api/auth/login/",
            {"username": user.username, "password": "Password123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)

    def test_create_and_edit_advertisement(self):
        user = self.create_user("ad_owner")
        self.verify_user_email(user)
        self.client.force_authenticate(user=user)

        create_payload = {
            "title": "Original title",
            "description": "Original description",
            "salary": "1200.00",
            "type_of_salary": "monthly",
            "work_time": "08:00-16:00",
            "position_type": "chef",
            "address": "Chef avenue 5",
            "contact_email": "owner@example.com",
            "contact_phone": "+38160111222",
        }
        create_response = self.client.post("/api/advertisements/", create_payload, format="json")
        self.assertEqual(create_response.status_code, 201)
        ad_uuid = create_response.data["uuid"]

        edit_payload = {
            "title": "Updated title",
            "position_type": "driver",
            "work_time": "10:00-18:00",
        }
        edit_response = self.client.patch(f"/api/advertisements/{ad_uuid}/", edit_payload, format="json")
        self.assertEqual(edit_response.status_code, 200)

        ad = Advertisement.objects.get(uuid=ad_uuid)
        self.assertEqual(ad.title, "Updated title")
        self.assertEqual(ad.position_type, "driver")
        self.assertEqual(ad.work_time, "10:00-18:00")

    def test_save_unsave_and_report_advertisement(self):
        owner = self.create_user("owner_user")
        reviewer = self.create_user("reviewer_user")
        self.verify_user_email(owner)
        self.verify_user_email(reviewer)
        ad = self.create_ad(owner)
        self.client.force_authenticate(user=reviewer)

        save_response = self.client.post(f"/api/advertisements/{ad.uuid}/save/")
        self.assertEqual(save_response.status_code, 200)
        self.assertTrue(save_response.data["saved"])
        self.assertTrue(SavedAdvertisement.objects.filter(user=reviewer, advertisement=ad).exists())

        unsave_response = self.client.post(f"/api/advertisements/{ad.uuid}/save/")
        self.assertEqual(unsave_response.status_code, 200)
        self.assertFalse(unsave_response.data["saved"])
        self.assertFalse(SavedAdvertisement.objects.filter(user=reviewer, advertisement=ad).exists())

        report_response = self.client.post(
            f"/api/advertisements/{ad.uuid}/report/",
            {"reason": "Spam"},
            format="json",
        )
        self.assertEqual(report_response.status_code, 200)
        self.assertTrue(AdvertisementReport.objects.filter(user=reviewer, advertisement=ad).exists())

        duplicate_report_response = self.client.post(
            f"/api/advertisements/{ad.uuid}/report/",
            {"reason": "Spam again"},
            format="json",
        )
        self.assertEqual(duplicate_report_response.status_code, 400)

    def test_report_profile_and_prevent_duplicates(self):
        reporter = self.create_user("reporter_user")
        reported = self.create_user("reported_user")
        self.verify_user_email(reporter)
        self.client.force_authenticate(user=reporter)

        response = self.client.post(
            f"/api/profiles/{reported.username}/",
            {"reason": "Impersonation"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            UserProfileReport.objects.filter(
                reporter=reporter,
                reported_user=reported,
            ).exists()
        )

        duplicate_response = self.client.post(
            f"/api/profiles/{reported.username}/",
            {"reason": "Still impersonation"},
            format="json",
        )
        self.assertEqual(duplicate_response.status_code, 400)

        own_profile_response = self.client.post(
            f"/api/profiles/{reporter.username}/",
            {"reason": "Self report"},
            format="json",
        )
        self.assertEqual(own_profile_response.status_code, 400)

    def test_profile_fetch_endpoints(self):
        user = self.create_user("profile_owner")
        self.verify_user_email(user)
        self.create_ad(user, title="Profile ad")

        self.client.force_authenticate(user=user)
        own_response = self.client.get("/api/profile/")
        self.assertEqual(own_response.status_code, 200)
        self.assertEqual(own_response.data["username"], user.username)

        self.client.force_authenticate(user=None)
        public_response = self.client.get(f"/api/profiles/{user.username}/")
        self.assertEqual(public_response.status_code, 200)
        self.assertEqual(public_response.data["profile"]["username"], user.username)
        self.assertEqual(len(public_response.data["advertisements"]), 1)
        self.assertEqual(public_response.data["advertisements"][0]["title"], "Profile ad")
