import { useEffect, useState } from "react";
import { apiFetch } from  "../utils/apiFetch";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import "../App.css"

const initialState = {
    title: "",
    description: "",
    salary: "",
    type_of_salary: "monthly",
    work_time: "",
    position_type: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    image: null
}

function CreateAdForm({ onSuccess })
{
    const { t } = useLanguage();
    const { user } = useAuth();
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const applyDefaults = (defaults) => {
            if (!isMounted) return;
            setForm((prev) => ({
                ...prev,
                contact_email: prev.contact_email || defaults.contact_email || "",
                contact_phone: prev.contact_phone || defaults.contact_phone || "",
            }));
        };

        const loadProfileDefaults = async () => {
            applyDefaults({
                contact_email: user?.email,
                contact_phone: user?.phone_number,
            });

            try {
                const response = await apiFetch("/api/profile/");
                if (!response.ok) return;
                const profile = await response.json();
                applyDefaults({
                    contact_email: profile.email,
                    contact_phone: profile.phone_number,
                });
            } catch {
                // Keep user context values if profile request fails.
            }
        };

        loadProfileDefaults();
        return () => {
            isMounted = false;
        };
    }, [user?.email, user?.phone_number]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!form.contact_email?.trim() || !form.contact_phone?.trim()) {
            setError(t("createAd.contactRequired"));
            setLoading(false);
            return;
        }

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== "")
            {
                formData.append(key, value);
            }
        });
        try {
            const response = await apiFetch("/api/advertisements/", {
                method: "POST",
                body: formData
            });

            if (!response.ok)
            {
                const contentType = response.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    const data = await response.json();
                    const firstError = Object.values(data)?.[0]?.[0];
                    throw new Error(firstError || data.detail || t("createAd.failedToCreate"));
                }
                throw new Error(t("createAd.failedToCreate"));
            }

            const data = await response.json();
            console.log("Created: ", data);
            setForm((prev) => ({
                ...initialState,
                contact_email: prev.contact_email,
                contact_phone: prev.contact_phone,
            }));
            onSuccess?.()
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false);
        }
    };

    return(
        <>
        <div className="auth-card auth-card-wide">
            <form className="ad-form" onSubmit={handleSubmit}>
                <ul className="form-list">
                    <li className="form-message form-error">{error && <p>{error}</p>}</li>
                    <li className="form-field">
                        <input
                            name="title"
                            type="text"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />
                            <label htmlFor="createAdTitle">{t("common.title")}</label>
                        </li>
                    <li className="form-field form-field-full">
                        <input
                            name="description"
                            type="text"
                            value={form.description}
                            onChange={handleChange}
                            required
                        />
                            <label htmlFor="createAdDescription">{t("common.description")}</label>
                        </li>
                    <li className="form-field">
                        <input
                            name="salary"
                            type="number"
                            min="1"
                            value={form.salary}
                            onChange={handleChange}
                            required
                        />
                            <label htmlFor="createAdSalary">{t("common.salary")}</label>
                        </li>
                    <li className="form-field">
                        <select
                            name="type_of_salary"
                            value={form.type_of_salary}
                            onChange={handleChange}
                        >
                            <option value="monthly">{t("createAd.monthly")}</option>
                            <option value="daily">{t("createAd.daily")}</option>
                            <option value="hourly">{t("createAd.hourly")}</option>
                        </select>
                        <label htmlFor="createAdTypeOfSalary">{t("createAd.typeOfSalary")}</label>
                    </li>
                    <li className="form-field">
                        <input
                            name="work_time"
                            type="text"
                            value={form.work_time}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="createAdWorkTime">{t("createAd.workTime")}</label>
                    </li>
                    <li className="form-field">
                        <select
                            name="position_type"
                            value={form.position_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">{t("createAd.selectPosition")}</option>
                            <option value="waiter">{t("createAd.waiter")}</option>
                            <option value="bartender">{t("createAd.bartender")}</option>
                            <option value="chef">{t("createAd.chef")}</option>
                            <option value="driver">{t("createAd.driver")}</option>
                            <option value="truck_driver">{t("createAd.truckDriver")}</option>
                            <option value="cashier">{t("createAd.cashier")}</option>
                            <option value="delivery">{t("createAd.delivery")}</option>
                            <option value="warehouse_worker">{t("createAd.warehouseWorker")}</option>
                            <option value="janitor">{t("createAd.janitor")}</option>
                        </select>
                        <label htmlFor="createAdPositionType">{t("createAd.positionType")}</label>
                    </li>
                    <li className="form-field form-field-full">
                        <input
                            name="address"
                            type="text"
                            value={form.address}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="createAdAddress">{t("createAd.address")}</label>
                    </li>
                    <li className="form-field">
                        <input
                            name="contact_email"
                            type="email"
                            value={form.contact_email}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="createAdContactEmail">{t("createAd.contactEmail")}</label>
                    </li>
                    <li className="form-field">
                        <input
                            name="contact_phone"
                            type="tel"
                            value={form.contact_phone}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="createAdContactPhone">{t("createAd.contactPhone")}</label>
                    </li>
                    <li className="form-field form-field-full">
                        <input
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleChange}
                        />
                        <label htmlFor="createAdImage">{t("createAd.banner")}</label>
                    </li>
                    <li className="form-actions">
                        <button className="btn-primary" type="submit" disabled={loading}>
                            {loading ? t("createAd.creating") : t("createAd.createButton")}
                        </button>
                    </li>
                </ul>
            </form>
        </div>
        </>
    );
}

export default CreateAdForm;
