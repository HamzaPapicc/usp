import LoginForm from "../components/LoginForm";
import { useAuth } from "../context/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

function Login()
{
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    if (isAuthenticated)
    {
        return <Navigate to="/"/>
    }
    return (
        <>
            <div className="login-page">
                <h1 className="login-title">{t("loginPage.title")}</h1>
                <LoginForm/>
                <div className="login-links">
                    <h3>{t("loginPage.noAccount")} <Link to="/register">{t("loginPage.register")}</Link></h3>
                    <h3><Link to="/reset-password/request">{t("loginPage.forgotPassword")}</Link></h3>
                </div>
            </div>
        </>
    );
}

export default Login;