import { useState } from "react";
import { apiFetch } from "../utils/apiFetch";
import { getCSRFToken } from "../utils/csrf";
import { useLanguage } from "../context/LanguageContext";

function SendEmailForPasswordResetForm()
{
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await apiFetch("/api/auth/password-reset/request/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify({ email })
            })
            setSuccess(t("auth.emailSent"));
        } catch {
            setError(t("auth.sendFailed"));
        } finally {
            setSending(false);
        }
    }
    return(
        <div className="auth-card">
            <form className="reset-form" onSubmit={handleSubmit}>
                <div className="reset-row">
                    <input
                        className="reset-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("common.email")}
                        required
                    />
                    <button className="reset-btn" type="submit" disabled={sending}>{sending ? t("auth.sending") : t("auth.sendEmail")}</button>
                </div>
                {success && <p className="reset-success">{success}</p>}
                {error && <p className="reset-error">{error}</p>}
            </form>
        </div>
    );
}

export default SendEmailForPasswordResetForm;
