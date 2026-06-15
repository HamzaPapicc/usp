import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

function NotifyForEmailVerification()
{
    const navigate = useNavigate();
    const { t } = useLanguage();
    return(
        <div>
            <h1>{t("emailVerification.checkInbox")}</h1>
            <button onClick={() => navigate("/")}>{t("emailVerification.goBack")}</button>
        </div>
    );
}

export default NotifyForEmailVerification;
