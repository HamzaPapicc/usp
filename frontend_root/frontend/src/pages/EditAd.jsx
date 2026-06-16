import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";
import { useLanguage } from "../context/LanguageContext";

function EditAd() {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        salary: "",
        type_of_salary: "monthly",
        work_time: "",
        position_type: "",
        address: "",
        contact_email: "",
        contact_phone: "",
    });

    const [bannerImage, setBannerImage] = useState(null);
    const [currentImage, setCurrentImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const readErrorMessage = async (response, fallback) => {
        try {
            const data = await response.json();
            if (typeof data?.detail === "string") return data.detail;
            return JSON.stringify(data);
        } catch {
            return fallback;
        }
    };

    // Fetch existing advertisement
    useEffect(() => {
        const fetchAd = async () => {
            try {
                const response = await apiFetch(
                    `/api/advertisements/${uuid}/`
                );

                if (!response.ok) {
                    throw new Error(t("editAd.failedLoad"));
                }

                const data = await response.json();

                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    salary: data.salary || "",
                    type_of_salary: data.type_of_salary || "monthly",
                    work_time: data.work_time || "",
                    position_type: data.position_type || "",
                    address: data.address || "",
                    contact_email: data.contact_email || "",
                    contact_phone: data.contact_phone || "",
                });
                setCurrentImage(data.image || "");

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, [uuid, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setBannerImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        setError(null);

        const data = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value ?? "");
        });

        if (bannerImage) {
            data.append("image", bannerImage);
        }

        try {
            const response = await apiFetch(
                `/api/advertisements/${uuid}/`,
                {
                    method: "PATCH",
                    body: data
                }
            );

            if (!response.ok) {
                throw new Error(await readErrorMessage(response, t("editAd.failedUpdate")));
            }

            const updated = await response.json();
            setCurrentImage(updated.image || currentImage);
            setSuccess(true);
        } catch (err) {
            setError(err.message || t("editAd.failedUpdate"));
        } finally {
            setSaving(false);
        }
    };
    if (loading) return <p className="page-status">{t("common.loading")}</p>;

    return (
        <div className="auth-page edit-ad-page">
            <div className="auth-topbar">
                <button className="auth-back-btn" onClick={() => navigate(`/advertisements/${uuid}`)}>
                    {t("common.back")}
                </button>
            </div>
            <h1 className="auth-title">{t("editAd.title")}</h1>
            <p className="auth-subtitle">{t("editAd.subtitle")}</p>

            <div className="auth-card auth-card-wide">
                <form className="edit-ad-form" onSubmit={handleSubmit}>
                    {error && <p className="form-message form-error">{error}</p>}
                    {success && <p className="form-message form-success">{t("editAd.updated")}</p>}

                    <div className="edit-ad-grid">
                        <div className="form-field">
                            <label>{t("common.title")}</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>{t("createAd.typeOfSalary")}</label>
                            <select
                                name="type_of_salary"
                                value={formData.type_of_salary}
                                onChange={handleChange}
                            >
                                <option value="monthly">{t("createAd.monthly")}</option>
                                <option value="daily">{t("createAd.daily")}</option>
                                <option value="hourly">{t("createAd.hourly")}</option>
                            </select>
                        </div>

                        <div className="form-field form-field-full">
                            <label>{t("common.description")}</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>{t("common.salary")}</label>
                            <input
                                type="number"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>{t("createAd.workTime")}</label>
                            <input
                                name="work_time"
                                value={formData.work_time}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>{t("createAd.positionType")}</label>
                            <select
                                name="position_type"
                                value={formData.position_type}
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
                        </div>

                        <div className="form-field">
                            <label>{t("createAd.address")}</label>
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>{t("createAd.contactEmail")}</label>
                            <input
                                type="email"
                                name="contact_email"
                                value={formData.contact_email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>{t("createAd.contactPhone")}</label>
                            <input
                                type="tel"
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>{t("editAd.bannerImage")}</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        {currentImage && (
                            <div className="form-field form-field-full edit-ad-image-preview">
                                <p className="form-hint">{t("editAd.currentImage")}</p>
                                <img src={currentImage} alt={t("editAd.bannerImage")} />
                            </div>
                        )}
                    </div>

                    <div className="edit-ad-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate(`/advertisements/${uuid}`)}
                        >
                            {t("common.back")}
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? t("editAd.saving") : t("editAd.saveChanges")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditAd;