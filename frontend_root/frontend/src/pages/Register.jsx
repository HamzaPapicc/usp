import RegisterForm from "../components/RegisterForm";
import { useAuth } from "../context/AuthContext";
import { Link, Navigate } from "react-router-dom";
import "../App.css"
import { useLanguage } from "../context/LanguageContext";

function Register()
{
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    if (isAuthenticated)
    {
        return <Navigate to="/"/>
    }

    return(
        <>
        <div className="login-page">
            <h1 className="login-title">{t("registerPage.title")}</h1>
            <RegisterForm/>
            <div className="login-links">
                <h3>{t("registerPage.alreadyHaveAccount")} <Link to="/login">{t("registerPage.login")}</Link></h3>
            </div>
        </div>
        </>
    );
}

export default Register;
