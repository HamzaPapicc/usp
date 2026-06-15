import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function ProtectedRoute()
{
    const { isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();
    
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
        return <Navigate to="/login" replace />
    }
    
    return <Outlet/>;
}

export default ProtectedRoute;
