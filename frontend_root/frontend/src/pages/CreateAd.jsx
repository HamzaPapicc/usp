import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CreateAdForm from "../components/CreateAdForm";
import { useLanguage } from "../context/LanguageContext";

function CreateAd() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (loading) return null;

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <button className="auth-back-btn" onClick={() => navigate("/")}>
          {t("common.back")}
        </button>
      </div>
      <h1 className="auth-title">{t("createAd.pageTitle")}</h1>
      <CreateAdForm />
    </div>
  );
}

export default CreateAd;