import { useState } from "react";
import { apiFetch } from "../utils/apiFetch";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

function EmailNotVerified()
{
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const { state } = useLocation();
    const [username, setUsername] = useState(state?.username || "");
    const { t } = useLanguage();

    const resend = async () => {
        const normalizedUsername = username.trim();
        if (!normalizedUsername) {
            setStatus(t("emailVerification.usernameRequired"));
            return;
        }

        setLoading(true);
        setStatus(false);
        try {
            const response = await apiFetch("/api/auth/resend-verification/",{
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username: normalizedUsername })
            });
            const data = await response.json();
            setStatus(data.detail);
        } catch {
            setStatus(t("emailVerification.failedResend"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1>{t("emailVerification.notVerifiedTitle")}</h1>
            <p>{t("emailVerification.notVerifiedSubtitle")}</p>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("common.username")}
            />
            <button onClick={resend} disabled={loading}>
                {loading ? t("auth.sending") : t("emailVerification.resend")}
            </button>
            {status && <p>{status}</p>}
        </div>
    );
}

export default EmailNotVerified;