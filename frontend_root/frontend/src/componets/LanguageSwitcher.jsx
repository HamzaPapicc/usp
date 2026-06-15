import { useLanguage } from "../context/LanguageContext";

function LanguageSwitcher() {
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="language-switcher" role="group" aria-label={t("language.label")}>
            <button
                type="button"
                className={`language-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
            >
                EN
            </button>
            <button
                type="button"
                className={`language-btn ${language === "sr" ? "active" : ""}`}
                onClick={() => setLanguage("sr")}
            >
                SR
            </button>
        </div>
    );
}

export default LanguageSwitcher;

