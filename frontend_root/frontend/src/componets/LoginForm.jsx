import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "../App.css"

function LoginForm()
{
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login(username, password);
            navigate("/");
        }
        catch(error)
        {
            if (error.message === "EMAIL_NOT_VERIFIED")
            {
                navigate("/email-not-verified", {
                    state: { username }
                });
                return;
            }
            if (error.message === "INVALID_CREDENTIALS")
            {
                setError(t("loginForm.invalidCredentials"));
                return;
            }
            setError(t("loginForm.loginFailed"));
        }
    };
    return (
        <>
            <div className="login-container">
                <form className="login-form" onSubmit={handleSubmit}>
                    <ul>
                        <li className="login-field">
                            <input
                                className="login-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <label htmlFor="loginUsername">{t("common.username")}</label>
                        </li>
                        <li className="login-field">
                            <input
                                className="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <label htmlFor="loginPassword">{t("common.password")}</label>
                        </li>
                        <li>
                            <button className="login-btn" type="submit">{t("common.submit")}</button>
                        </li>
                        {error && <li className="login-error">{error}</li>}
                    </ul>
                </form>
            </div>
        </>
    );
}

export default LoginForm;
