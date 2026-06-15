import ResetPasswordForm from "../components/ResetPasswordForm";
import { useLanguage } from "../context/LanguageContext";

function ResetPasswordConfirm()
{
    const { t } = useLanguage();
    return(
        <>
            <div className="auth-page">
                <h1 className="auth-title">{t("auth.resetPasswordTitle")}</h1>
                <ResetPasswordForm/>
            </div>
        </>
    );
}

export default ResetPasswordConfirm;
