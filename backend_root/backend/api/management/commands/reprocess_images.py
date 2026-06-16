from django.core.management.base import BaseCommand

from api.models import Advertisement, UserProfile, normalize_uploaded_image


class Command(BaseCommand):
    help = (
        "Reprocesses existing uploaded images to current normalized sizes. "
        "Profiles => 512x512, Ads => 1280x720."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--target",
            choices=("all", "profiles", "ads"),
            default="all",
            help="Select which image group to process.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Process at most N objects from each selected group.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only show how many objects would be processed.",
        )

    def handle(self, *args, **options):
        target = options["target"]
        limit = options["limit"]
        dry_run = options["dry_run"]

        if target in ("all", "profiles"):
            self._process_profiles(limit=limit, dry_run=dry_run)

        if target in ("all", "ads"):
            self._process_ads(limit=limit, dry_run=dry_run)

    def _base_profile_queryset(self):
        return UserProfile.objects.exclude(profile_picture="").exclude(
            profile_picture__isnull=True
        )

    def _base_ad_queryset(self):
        return Advertisement.objects.exclude(image="").exclude(image__isnull=True)

    def _process_profiles(self, limit=None, dry_run=False):
        queryset = self._base_profile_queryset().order_by("uuid")
        if limit:
            queryset = queryset[:limit]

        total = queryset.count()
        self.stdout.write(f"Profiles queued: {total}")
        if dry_run:
            self.stdout.write("Dry run enabled. No files were modified.")
            return

        updated = 0
        failed = 0

        for profile in queryset.iterator():
            try:
                changed = normalize_uploaded_image(
                    profile.profile_picture,
                    (512, 512),
                    force=True,
                )
                if changed:
                    profile.save(update_fields=["profile_picture"])
                    updated += 1
            except Exception as exc:
                failed += 1
                self.stderr.write(
                    f"[profile:{profile.uuid}] failed: {exc}"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Profiles reprocessed: {updated}; failed: {failed}"
            )
        )

    def _process_ads(self, limit=None, dry_run=False):
        queryset = self._base_ad_queryset().order_by("uuid")
        if limit:
            queryset = queryset[:limit]

        total = queryset.count()
        self.stdout.write(f"Ads queued: {total}")
        if dry_run:
            self.stdout.write("Dry run enabled. No files were modified.")
            return

        updated = 0
        failed = 0

        for ad in queryset.iterator():
            try:
                changed = normalize_uploaded_image(
                    ad.image,
                    (1280, 720),
                    force=True,
                )
                if changed:
                    ad.save(update_fields=["image"])
                    updated += 1
            except Exception as exc:
                failed += 1
                self.stderr.write(
                    f"[ad:{ad.uuid}] failed: {exc}"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Ads reprocessed: {updated}; failed: {failed}"
            )
        )