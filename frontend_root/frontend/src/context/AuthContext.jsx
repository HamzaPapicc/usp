import { createContext, useContext, useEffect, useState } from "react";
import { ensureCSRF, getCSRFToken } from "../utils/csrf";
import { apiFetch } from "../utils/apiFetch";

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                await apiFetch("/api/csrf/");

                const profileResponse = await apiFetch("/api/profile/");

                if (!profileResponse.ok)
                {
                    throw new Error("Profile fetch failed");
                }

                const data = await profileResponse.json();
                setUser(data);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        initAuth();
    }, []);

    const login = async (username, password) => {
        const response = await apiFetch("/api/auth/login/", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username, password})
        });

        let data = {};
        try {
            data = await response.json();
        } catch {}

        if (!response.ok)
        {
            if (response.status === 403 && data.detail === "Email not verified")
            {
                const error = new Error("EMAIL_NOT_VERIFIED");
                throw error;
            }
            if (response.status === 401)
            {
                throw new Error("INVALID_CREDENTIALS");
            }
            throw new Error("LOGIN_FAILED");
        }

        const profile = await apiFetch("/api/profile/");
        if (!profile.ok)
        {
            throw new Error("PROFILE_FETCH_FAILED");
        }

        setUser(await profile.json());
    };

    const logout = async () => {
        await ensureCSRF();

        const response = await apiFetch("/api/logout/", {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("LOGOUT_FAILED");
        }

        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                logout,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);