import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../utils/apiFetch";

function VerifyEmail()
{
    const { token } = useParams();
    const { t } = useLanguage();
    const [status, setStatus] = useState(t("emailVerification.verifying"));
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        apiFetch(`/api/auth/verify-email/${token}/`)
        .then(async (response) => {
            let data = {};
            try {
                data = await response.json();
            } catch {}

            if (response.ok)
            {
                setStatus(t("emailVerification.verifiedCanLogin"));
                setCanResend(false);
                return;
            }

            setStatus(data.detail || t("emailVerification.verificationFailed"));
            setCanResend(true);
        })
        .catch(() => {
            setStatus(t("emailVerification.verificationFailed"));
            setCanResend(true);
        });
    }, [token, t]);

    return (
        <div>
            <h1>{status}</h1>
            {canResend && (
                <a href="/email-not-verified">{t("emailVerification.resendLink")}</a>
            )}
        </div>
    );
}

export default VerifyEmail;
