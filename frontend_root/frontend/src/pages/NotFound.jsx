import { useLanguage } from "../context/LanguageContext";

function NotFound()
{
    const { t } = useLanguage();
    return(
        <>
            <h1>404</h1>
            <p>{t("notFound.pageNotFound")}</p>
        </>
    );
}

export default NotFound;
