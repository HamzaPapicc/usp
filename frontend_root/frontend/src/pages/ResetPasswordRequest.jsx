import SendEmailForPasswordResetForm from "../components/SendEmailForPasswordResetForm";
import "../App.css"
import { useLanguage } from "../context/LanguageContext";
function ResetPasswordRequest()
{
    const { t } = useLanguage();
    return(
        <>
            <div className="auth-page">
                <h1 className="auth-title">{t("auth.resetPasswordRequestTitle")}</h1>
                <SendEmailForPasswordResetForm/>
            </div>
        </>
    );
}

export default ResetPasswordRequest;
