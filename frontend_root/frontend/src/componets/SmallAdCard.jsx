import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

import "../App.css"

function SmallAdCard({ ad, onDelete, onSaveToggle, onReport, showPlaceholderBanner = false })
{
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const isOwner = user?.username === ad.posted_by?.username;

    const goToProfile = (e) => {
        e.stopPropagation();
        navigate(`/profiles/${ad.posted_by.username}`);
    }

    return(
        <div className="ad-card" onClick={() => {navigate(`/advertisements/${ad.uuid}`);}}>
            <header className="ad-card-header">
                {ad.image && (
                    <div className="ad-card-image">
                        <img
                            src={ad.image}
                            alt={ad.title}
                        />
                    </div>
                )}
                {!ad.image && showPlaceholderBanner && (
                    <div className="ad-card-image ad-card-image-placeholder" aria-hidden="true" />
                )}
                <h3 className="ad-card-title">{ad.title}</h3>
            </header>
            <div className="ad-card-body">
                <p>{ad.description?.slice(0, 60)}...</p>
            </div>
            <footer className="ad-card-footer">
                <span className="ad-card-author" onClick={goToProfile}>{ad.posted_by?.display_name || ad.posted_by?.username}</span>
                <div className="ad-card-actions">
                    {isOwner && (
                        <>
                            <button className="ad-card-btn" onClick={() => navigate(`/advertisements/${ad.uuid}/edit`)}>{t("common.edit")}</button>
                            <button className="ad-card-btn" onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(ad.uuid);
                            }}>{t("common.delete")}</button>
                        </>
                    )}
                    <button className="ad-card-btn" onClick={(e) => {
                        e.stopPropagation();
                        onReport?.(ad.uuid);
                    }}>{t("common.report")}</button>
                    <button className="ad-card-btn" onClick={(e) => {
                        e.stopPropagation();
                        onSaveToggle?.(ad.uuid);
                    }}>{ad.is_saved ? "\u2605" : "\u2606"}{ad.save_count}</button>
                </div>
            </footer>
        </div>
    );
}

export default SmallAdCard;
