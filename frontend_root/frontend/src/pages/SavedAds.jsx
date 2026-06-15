import { useEffect, useState } from "react";
import SmallAdCard from "../components/SmallAdCard";
import { apiFetch } from "../utils/apiFetch";
import { useLanguage } from "../context/LanguageContext";
import { useFeedback } from "../context/FeedbackContext";

function SavedAds() {
    const { t } = useLanguage();
    const { notify, confirm, promptInput } = useFeedback();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleSaveToggle = async (uuid) => {
        try {
            const response = await apiFetch(
                `/api/advertisements/${uuid}/save/`,
                { method: "POST" }
            );

            if (!response.ok) throw new Error();

            const data = await response.json();

            setAds(prev =>
                prev.map(ad =>
                    ad.uuid === uuid
                        ? {
                            ...ad,
                            is_saved: data.saved,
                            save_count: data.saved
                                ? ad.save_count + 1
                                : Math.max(0, ad.save_count - 1)
                        }
                        : ad
                )
            );
        } catch {
            notify(t("profile.failedSave"), "error");
        }
    };

    const handleReport = async (uuid) => {
        const reason = await promptInput({
            title: t("common.report"),
            message: t("profile.reportPrompt"),
            confirmText: t("common.report"),
            cancelText: t("common.cancel"),
            placeholder: t("profile.reportPrompt"),
            required: true,
        });

        if (!reason) return;

        try {
            const response = await apiFetch(
                `/api/advertisements/${uuid}/report/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason })
                }
            );

            if (!response.ok) throw new Error();

            notify(t("profile.reportSuccess"), "success");
        } catch {
            notify(t("profile.failedReport"), "error");
        }
    };

    const handleDelete = async (uuid) => {
        const isConfirmed = await confirm({
            title: t("common.delete"),
            message: t("profile.confirmDelete"),
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

            if (!response.ok) throw new Error();

            setAds(prev => prev.filter(ad => ad.uuid !== uuid));
        } catch {
            notify(t("profile.deleteFailed"), "error");
        }
    };

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const response = await apiFetch(
                    "/api/advertisements/saved/"
                );

                if (!response.ok) {
                    throw new Error(t("savedAds.failedLoad"));
                }

                const data = await response.json();
                setAds(data.results);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSaved();
    }, []);

    if (loading) return <h2>{t("common.loading")}</h2>;
    if (error) return <h2>{error}</h2>;

    return (
        <div>
            <h1>{t("savedAds.title")}</h1>

            {ads.length === 0 && (
                <p>{t("savedAds.empty")}</p>
            )}

            {ads.map(ad => (
                    <SmallAdCard
                        key={ad.uuid}
                        ad={ad}
                        onDelete={() => handleDelete(ad.uuid)}
                        onSaveToggle={() => handleSaveToggle(ad.uuid)}
                        onReport={() => handleReport(ad.uuid)}
                    />    ))}
        </div>
    );
}

export default SavedAds;
