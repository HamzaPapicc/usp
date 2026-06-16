import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useFeedback } from "../context/FeedbackContext";

function AdDetail() {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { notify, confirm, promptInput } = useFeedback();

    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const response = await apiFetch(`/api/advertisements/${uuid}/`);
                if (!response.ok) {
                    throw new Error(t("adDetail.failedLoad"));
                }
                const data = await response.json();
                setAd(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, [uuid, t]);

    const handleSaveToggle = async () => {
        try {
            const response = await apiFetch(
                `/api/advertisements/${uuid}/save/`,
                { method: "POST" }
            );

            if (!response.ok) {
                throw new Error(t("adDetail.failedSaveToggle"));
            }

            const data = await response.json();

            setAd((prev) => ({
                ...prev,
                is_saved: data.saved,
                save_count: data.saved
                    ? prev.save_count + 1
                    : Math.max(0, prev.save_count - 1),
            }));
        } catch (err) {
            notify(err.message || t("adDetail.failedSaveToggle"), "error");
        }
    };

    const handleDelete = async () => {
        const isConfirmed = await confirm({
            title: t("common.delete"),
            message: t("adDetail.confirmDelete"),
            confirmText: t("common.delete"),
            cancelText: t("common.cancel"),
            danger: true,
        });

        if (!isConfirmed) return;

        try {
            const response = await apiFetch(
                `/api/advertisements/${uuid}/`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                throw new Error(t("profile.deleteFailed"));
            }

            navigate("/");
        } catch (err) {
            notify(err.message || t("profile.deleteFailed"), "error");
        }
    };

    const handleReport = async () => {
        const reason = await promptInput({
            title: t("common.report"),
            message: t("adDetail.reportPrompt"),
            confirmText: t("common.report"),
            cancelText: t("common.cancel"),
            placeholder: t("adDetail.reportPrompt"),
            required: true,
        });

        if (!reason) return;

        try {
            const response = await apiFetch(
                `/api/advertisements/${uuid}/report/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason }),
                }
            );

            if (!response.ok) {
                throw new Error(t("adDetail.failedSubmitReport"));
            }

            notify(t("adDetail.reportSubmitted"), "success");
        } catch (err) {
            notify(err.message || t("adDetail.failedSubmitReport"), "error");
        }
    };

    if (loading) return <p className="page-status">{t("adDetail.loading")}</p>;
    if (error) return <p className="page-status page-status-error">{error}</p>;
    if (!ad) return null;

    const isOwner = user?.username === ad.posted_by?.username;

    return (
        <div className="ad-detail-page">
            <div className="ad-detail-header">
                <button className="btn-navy" onClick={() => navigate("/")}>{t("common.back")}</button>
                <p className="ad-detail-header-caption">{t("adDetail.headerCaption")}</p>
            </div>

            <div className="ad-detail-card">
                {ad.image && (
                    <img src={ad.image} alt={ad.title} className="ad-banner" />
                )}

                <div className="ad-detail-body">
                    <h1 className="ad-title">{ad.title}</h1>
                    <p className="ad-description">{ad.description}</p>

                    <div className="ad-meta">
                        <p><strong>{t("common.salary")}:</strong> {ad.salary || t("adDetail.salaryNotSpecified")}</p>

                        <p>
                            <strong>{t("adDetail.postedBy")}:</strong>{" "}
                            <span
                                className="ad-author-link"
                                onClick={() => navigate(`/profiles/${ad.posted_by.username}`)}
                            >
                                {ad.posted_by.display_name || ad.posted_by.username}
                            </span>
                        </p>
                        <p><strong>{t("adDetail.contactEmail")}:</strong> {ad.contact_email || t("adDetail.contactNotProvided")}</p>
                        <p><strong>{t("adDetail.contactPhone")}:</strong> {ad.contact_phone || t("adDetail.contactNotProvided")}</p>

                        <p className="ad-saved">{t("adDetail.savedByUsers", { count: ad.save_count })}</p>
                    </div>

                    <div className="ad-actions">
                        {!isOwner && (
                            <>
                                <button className="btn-primary" onClick={handleSaveToggle}>
                                    {ad.is_saved ? t("common.unsave") : t("common.save")}
                                </button>
                                <button className="btn-secondary" onClick={handleReport}>
                                    {t("common.report")}
                                </button>
                            </>
                        )}

                        {isOwner && (
                            <>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate(`/advertisements/${uuid}/edit`)}
                                >
                                    {t("common.edit")}
                                </button>
                                <button className="btn-danger" onClick={handleDelete}>
                                    {t("common.delete")}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdDetail;