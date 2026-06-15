import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";
import { useLanguage } from "../context/LanguageContext";
import { useFeedback } from "../context/FeedbackContext";
import "../App.css"
import SmallAdCard from "../components/SmallAdCard";
function Profile()
{
    const { username } = useParams();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const isOwnProfile = !username && isAuthenticated;
    const [profile, setProfile] = useState(null);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { notify, confirm, promptInput } = useFeedback();

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

    const handleProfileReport = async () => {
        const targetUsername = username || profile?.username;
        if (!targetUsername) return;

        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        const reason = await promptInput({
            title: t("profile.reportProfile"),
            message: t("profile.reportProfilePrompt"),
            confirmText: t("common.report"),
            cancelText: t("common.cancel"),
            placeholder: t("profile.reportProfilePrompt"),
            required: true,
        });

        if (!reason) return;

        try {
            const response = await apiFetch(
                `/api/profiles/${targetUsername}/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || t("profile.reportProfileFailed"));
            }

            notify(t("profile.reportProfileSuccess"), "success");
        } catch (error) {
            notify(error.message || t("profile.reportProfileFailed"), "error");
        }
    };

    useEffect(() => {
        if (authLoading) {
            return;
        }

        let isMounted = true;
        setLoading(true);

        const loadProfile = async () => {
            try {
                if (isOwnProfile) {
                    const profileResponse = await apiFetch("/api/profile/");
                    if (!profileResponse.ok) {
                        throw new Error(t("profile.failedFetchProfile"));
                    }
                    const ownProfile = await profileResponse.json();
                    if (!isMounted) return;
                    setProfile(ownProfile);

                    // Public profile endpoint includes the user's advertisements.
                    const adsResponse = await apiFetch(`/api/profiles/${ownProfile.username}/`);
                    if (!adsResponse.ok) {
                        throw new Error(t("profile.failedFetchProfile"));
                    }
                    const adsData = await adsResponse.json();
                    if (!isMounted) return;
                    setAds(adsData.advertisements || []);
                } else if (username) {
                    const response = await apiFetch(`/api/profiles/${username}/`);
                    if (!response.ok) {
                        throw new Error(t("profile.failedFetchProfile"));
                    }
                    const data = await response.json();
                    if (!isMounted) return;
                    setProfile(data.profile);
                    setAds(data.advertisements || []);
                }
            } catch (error) {
                console.error(error);
                if (!isMounted) return;
                setProfile(null);
                setAds([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [username, isOwnProfile, authLoading, t]);

    if (authLoading || loading)
    {
        return(
            <p>{t("common.loading")}</p>
        );
    }
    if (!profile)
    {
        return(
            <p>{t("profile.notFound")}</p>
        );
    }

    return(
        <>
            <div className="full-page-container">
                <div className="profile-header">
                    <div className="profile-actions">
                        <button className="btn-navy profile-btn" onClick={() => navigate("/")}>{t("common.back")}</button>
                        { isOwnProfile && <button className="btn-navy profile-btn" onClick={() => navigate("/edit-profile")}>{t("profile.editProfile")}</button>}
                        { !isOwnProfile && <button className="btn-secondary profile-btn profile-btn-secondary" onClick={handleProfileReport}>{t("profile.reportProfile")}</button>}
                    </div>
                    <div className="profile-info">
                        <h1>{profile.display_name}</h1>
                        <h3>{profile.username}</h3>
                        {isOwnProfile ? (
                            <>
                                <p>{t("common.email")}: {profile.email}</p>
                                <p>{t("profile.phone")}: {profile.phone_number}</p>
                            </>
                        ) : (
                            <>
                                <p>{t("profile.bio")}: {profile.bio}</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="profile-ads">
                    <h3>{t("profile.advertisements")}</h3>
                    {ads.length === 0 && <p className="profile-empty">{t("profile.noAdvertisements")}</p>}
                    <div className="ads-grid">
                        {ads.map(ad => (
                            <SmallAdCard
                                key={ad.uuid}
                                ad={ad}
                                onDelete={() => handleDelete(ad.uuid)}
                                onSaveToggle={() => handleSaveToggle(ad.uuid)}
                                onReport={() => handleReport(ad.uuid)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Profile;
