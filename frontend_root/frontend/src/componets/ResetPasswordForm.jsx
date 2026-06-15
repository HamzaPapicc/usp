import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom"
import { apiFetch } from "../utils/apiFetch"
import { useLanguage } from "../context/LanguageContext";
function ResetPasswordForm()
{
    const { token } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword)
        {
            setError(t("auth.passwordsDoNotMatch"));
            return;
        }
        setSaving(true);
        try {
            const response = await apiFetch(`/api/auth/password-reset/confirm/${token}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password })
            });
            if (!response.ok)
            {
                const data = await response.json();
                throw new Error(data.detail || t("auth.resetFailed"));
            }
            navigate("/login", {
                state: { message: t("auth.resetSuccess") }
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    }
    return (
        <div className="auth-card">
        <form onSubmit={handleSubmit}>
            <div className="auth-stack">
            <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.newPassword")}
                required
            />

            <input
                className="auth-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("common.confirmPassword")}
                required
            />

            <button className="auth-btn" type="submit" disabled={saving}>
                {saving ? t("auth.resetting") : t("auth.resetPassword")}
            </button>

            {error && <p className="auth-message auth-error">{error}</p>}
            </div>
        </form>
        </div>
    );
}

export default ResetPasswordForm;
