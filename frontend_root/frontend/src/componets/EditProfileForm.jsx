import { useEffect, useState } from "react";
import { getCSRFToken } from "../utils/csrf";
import { apiFetch } from "../utils/apiFetch";
import { useLanguage } from "../context/LanguageContext";

function EditProfileForm()
{
    const { t } = useLanguage();
    const [form, setForm] = useState({
        display_name: "",
        bio: "",
        email: "",
        phone_number: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await apiFetch("/api/profile/");
                if (!response.ok)
                {
                    throw new Error(t("editProfile.failedLoad"));
                }
                const data = await response.json();
                setForm({
                    display_name: data.display_name ?? "",
                    bio: data.bio ?? "",
                    email: data.email ?? "",
                    phone_number: data.phone_number ?? ""
                });
            }
            catch (error) {
                setError(error.message);
            }
            finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [t]);

    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await apiFetch("/api/profile/",{
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify(form)
            });
            if (!response.ok)
            {
                const data = await response.json()
                throw new Error(data.detail || t("editProfile.updateFailed"))
            }
            setSuccess(true);
        }
        catch (error) {
            setError(error.message);
        }
        finally {
            setSaving(false);
        }
    };

    if (loading)
    {
        return(
            <>
                <h1>{t("common.loading")}</h1>
            </>
        )
    }

    return (
        <div className="auth-card auth-card-wide">
        {error && <p className="form-message form-error">{error}</p>}
        {success && <p className="form-message form-success">{t("editProfile.updated")}</p>}

        <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-form-grid">
            <div className="form-field">
                <label htmlFor="editProfileDisplayName">{t("common.displayName")}</label>
                <input
                id="editProfileDisplayName"
                type="text"
                name="display_name"
                value={form.display_name}
                onChange={handleChange}
                />
            </div>

            <div className="form-field form-field-full">
                <label htmlFor="editProfileBio">{t("editProfile.bio")}</label>
                <textarea
                id="editProfileBio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                />
            </div>

            <div className="form-field">
                <label htmlFor="editProfileEmail">{t("common.email")}</label>
                <input
                id="editProfileEmail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                />
            </div>

            <div className="form-field">
                <label htmlFor="editProfilePhoneNumber">{t("editProfile.phoneNumber")}</label>
                <input
                id="editProfilePhoneNumber"
                name="phone_number"
                type="text"
                value={form.phone_number}
                onChange={handleChange}
                />
            </div>
            </div>

            <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? t("editProfile.saving") : t("editProfile.saveChanges")}
            </button>

            <hr className="profile-divider" />

            <div className="profile-danger-row">
            <button type="button" className="btn-secondary">
                {t("editProfile.changePassword")}
            </button>
            <button type="button" className="btn-danger">
                {t("editProfile.deleteAccount")}
            </button>
            </div>
        </form>
        </div>
    );
}

export default EditProfileForm;
