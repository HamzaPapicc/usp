import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../utils/mediaUrl";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useFeedback } from "../context/FeedbackContext";
import defaultAvatar from "../assets/default-avatar.svg";
import "../App.css";
import SidebarFilters from "./SidebarFilters";

function SideMenu({ filters, setFilters }) {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const { t } = useLanguage();
    const { notify } = useFeedback();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            setMenuOpen(false);
            navigate("/login");
        } catch {
            notify(t("auth.logoutFailed"), "error");
        }
    };

    if (loading) {
        return null;
    }

    if (!isAuthenticated) {
        if (location.pathname === "/login") {
            return null;
        }

        return (
            <>
                <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label={t("sideMenu.toggleMenu")}>
                    &#9776;
                </button>
                <aside className={`side-menu ${menuOpen ? "open" : ""}`}>
                    <button className="side-menu-btn" onClick={() => navigate("/login")}>{t("sideMenu.login")}</button>
                    <SidebarFilters filters={filters} setFilters={setFilters} />
                </aside>
            </>
        );
    }

    return (
        <>
            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label={t("sideMenu.toggleMenu")}>
                &#9776;
            </button>
            <aside className={`side-menu ${menuOpen ? "open" : ""}`}>
                <div className="side-menu-user">
                    <img
                        className="side-menu-avatar"
                        src={user.profile_picture ? mediaUrl(user.profile_picture) : defaultAvatar}
                        alt={t("sideMenu.imageAlt")}
                        width={50}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = defaultAvatar;
                        }}
                    />
                </div>
                <div className="side-menu-info">
                    <strong
                        className="side-menu-name"
                        onClick={() => navigate("/profile")}
                        style={{ cursor: "pointer" }}
                    >
                        {user.display_name}
                    </strong>
                    <div className="side-menu-username">{user.username}</div>
                </div>
                <div className="side-menu-actions">
                    <button className="side-menu-btn" onClick={handleLogout}>{t("sideMenu.logout")}</button>
                    <button className="side-menu-btn" onClick={() => navigate("/advertisements/create")}>{t("sideMenu.createAd")}</button>
                </div>
                <SidebarFilters filters={filters} setFilters={setFilters} />
            </aside>
        </>
    );
}

export default SideMenu;
