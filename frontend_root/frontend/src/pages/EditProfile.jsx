import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import EditProfileForm from "../components/EditProfileForm";
import { useLanguage } from "../context/LanguageContext";

function EditProfile()
{
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        if (!loading && !isAuthenticated)
        {
            navigate("/login", {replace: true});
        }
    }, [loading, isAuthenticated, navigate]);

    if (loading)
    {
        return(
            <>
                <h1>{t("common.loading")}</h1>
            </>
        );
    }

    if (!isAuthenticated)
    {
        return null;
    }
    
    return(
        <>
            <div className="auth-page">
                <div className="auth-topbar">
                    <button onClick={() => navigate("/profile")}>{t("common.back")}</button>
                </div>
                <h1 className="auth-title">{t("editProfile.title")}</h1>
                <EditProfileForm/>
            </div>
        </>
    );
}

export default EditProfile;