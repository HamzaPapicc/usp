import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";
import { getCSRFToken } from "../utils/csrf";
import { useLanguage } from "../context/LanguageContext";
import "../App.css"

function RegisterForm()
{
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        display_name: ""
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (formData.password !== formData.confirmPassword)
        {
            setError(t("registerForm.passwordsDontMatch"));
            return;
        }
        setLoading(true);
        try {
            const response = await apiFetch("/api/auth/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    display_name: formData.display_name || undefined
                })
            });
            if (!response.ok)
            {
                const contentType = response.headers.get("content-type") || "";
                let errorMessage = `Registration failed (${response.status})`;
                if (contentType.includes("application/json")) {
                    const data = await response.json();
                    errorMessage = data.detail || JSON.stringify(data);
                } else {
                    const text = (await response.text()).trim();
                    if (text) {
                        errorMessage = text.split("\n")[0];
                    }
                }
                throw new Error(errorMessage);
            }
            navigate("/verify-email-notification");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false)
        }
    };
    return(
        <>
            <div className="register-container">
                <form className="register-form" onSubmit={handleSubmit}>
                    <ul>
                        <li className="register-field">
                            <input
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="registerUserUsername">{t("common.username")}</label>
                        </li>
                        <li className="register-field">
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="registerUserEmail">{t("common.email")}</label>
                        </li>
                        <li className="register-field">
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="registerUserPassword">{t("common.password")}</label>
                        </li>
                        <li className="register-field">
                            <input
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="registerConfirmPassword">{t("common.confirmPassword")}</label>
                        </li>
                        <li className="register-field">
                            <input
                                name="display_name"
                                type="text"
                                value={formData.display_name}
                                onChange={handleChange}
                            />
                            <label htmlFor="registerUserDisplayName">{t("common.displayName")}</label>
                        </li>
                        <li>
                            <button className="register-btn" type="submit" disabled={loading}>{loading ? t("registerForm.registering") : t("registerForm.register")}</button>
                        </li>
                    </ul>
                    {error && <p className="register-error">{error}</p>}
                </form>
            </div>
        </>
    );
}

export default RegisterForm;
