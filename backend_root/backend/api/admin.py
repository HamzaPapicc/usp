from django.contrib import admin
from django.db.models import Count
from .models import AdvertisementReport, UserProfileReport


@admin.action(description="Mark selected reports as pending")
def mark_pending(modeladmin, request, queryset):
    queryset.update(status="pending")


@admin.action(description="Mark selected reports as reviewed")
def mark_reviewed(modeladmin, request, queryset):
    queryset.update(status="reviewed")


@admin.action(description="Mark selected reports as dismissed")
def mark_dismissed(modeladmin, request, queryset):
    queryset.update(status="dismissed")


@admin.action(description="Mark selected reports as action taken")
def mark_action_taken(modeladmin, request, queryset):
    queryset.update(status="action_taken")


class BaseReportAdmin(admin.ModelAdmin):
    list_filter = ("status", "created_at")
    readonly_fields = ("created_at",)
    actions = (mark_pending, mark_reviewed, mark_dismissed, mark_action_taken)
    change_list_template = "admin/api/report_changelist.html"

    def changelist_view(self, request, extra_context=None):
        counts = {key: 0 for key, _ in self.model.STATUS_CHOICES}
        totals = self.model.objects.values("status").annotate(total=Count("id"))
        for row in totals:
            counts[row["status"]] = row["total"]

        extra_context = extra_context or {}
        extra_context["status_counts"] = [
            {"key": key, "label": label, "count": counts[key]}
            for key, label in self.model.STATUS_CHOICES
        ]
        extra_context["total_reports"] = sum(counts.values())
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(AdvertisementReport)
class AdvertisementReportAdmin(BaseReportAdmin):
    list_display = ("id", "user", "advertisement", "status", "created_at")
    search_fields = ("user__username", "advertisement__title", "reason")
    raw_id_fields = ("user", "advertisement")


@admin.register(UserProfileReport)
class UserProfileReportAdmin(BaseReportAdmin):
    list_display = ("id", "reporter", "reported_user", "status", "created_at")
    search_fields = ("reporter__username", "reported_user__username", "reason")
    raw_id_fields = ("reporter", "reported_user")