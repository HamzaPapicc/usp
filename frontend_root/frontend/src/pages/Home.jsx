import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch } from "../utils/apiFetch";
import { useNavigate, useOutletContext } from "react-router-dom";
import SmallAdCard from "../components/SmallAdCard";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

function Home() {
  const { filters } = useOutletContext();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { notify, confirm, promptInput } = useFeedback();
  const navigate = useNavigate();

  const [ads, setAds] = useState([]);
  const [nextPage, setNextPage] = useState("/api/advertisements/");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // applied

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loaderRef = useRef(null);

  const normalizeApiPath = useCallback((url) => {
    if (!url) return url;
    try {
      const parsed = new URL(url, window.location.origin);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }, []);

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }
    return true;
  }, [isAuthenticated, navigate]);

  const handleSaveToggle = useCallback(async (uuid) => {
    if (!requireAuth()) return;

    try {
      const response = await apiFetch(
        `/api/advertisements/${uuid}/save/`,
        { method: "POST" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t("profile.failedSave"));
      }

      setAds((prev) =>
        prev.map((ad) =>
          ad.uuid === uuid
            ? {
                ...ad,
                is_saved: data.saved,
                save_count: data.saved
                  ? ad.save_count + 1
                  : Math.max(0, ad.save_count - 1),
              }
            : ad
        )
      );
    } catch (err) {
      notify(err.message || t("profile.failedSave"), "error");
    }
  }, [requireAuth, t, notify]);

  const handleReport = useCallback(async (uuid) => {
    if (!requireAuth()) return;

    const reason = await promptInput({
      title: t("common.report"),
      message: t("profile.reportPrompt"),
      confirmText: t("common.report"),
      cancelText: t("common.cancel"),
      placeholder: t("profile.reportPrompt"),
      required: true,
    });
    if (!reason) return;

    try {
      const response = await apiFetch(
        `/api/advertisements/${uuid}/report/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t("profile.failedReport"));
      }

      notify(t("profile.reportSuccess"), "success");
    } catch (err) {
      notify(err.message || t("profile.failedReport"), "error");
    }
  }, [requireAuth, t, notify, promptInput]);

  const handleDelete = useCallback(async (uuid) => {
    if (!requireAuth()) return;

    const isConfirmed = await confirm({
      title: t("common.delete"),
      message: t("profile.confirmDelete"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      danger: true,
    });
    if (!isConfirmed) return;

    try {
      const response = await apiFetch(
        `/api/advertisements/${uuid}/`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(t("profile.deleteFailed"));
      }

      setAds((prev) => prev.filter((ad) => ad.uuid !== uuid));
    } catch (err) {
      notify(err.message || t("profile.deleteFailed"), "error");
    }
  }, [requireAuth, t, notify, confirm]);

  const loadPage = useCallback(async (url) => {
    if (!url || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(normalizeApiPath(url));
      if (!response.ok) throw new Error(t("home.fetchFailed"));

      const data = await response.json();

      setAds((prev) => {
        const existing = new Set(prev.map((a) => a.uuid));
        const filtered = (data.results || []).filter((ad) => !existing.has(ad.uuid));
        return [...prev, ...filtered];
      });

      setNextPage(data.next); // may be null
    } catch (e) {
      setError(e.message || t("home.fetchFailed"));
      setNextPage(null);
    } finally {
      setLoading(false);
    }
  }, [loading, normalizeApiPath, t]);

  // 1) When filters/search are APPLIED -> reset list and set first page URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.append("search", searchQuery);
    if (filters.position_type?.length) params.append("position_type", filters.position_type.join(","));
    if (filters.salary_min) params.append("salary_min", filters.salary_min);
    if (filters.salary_max) params.append("salary_max", filters.salary_max);

    const url = `/api/advertisements/?${params.toString()}`;

    setAds([]);
    setNextPage(url);
  }, [searchQuery, filters]);

  // 2) When nextPage becomes the first page AND ads is empty -> load it once
  useEffect(() => {
    if (ads.length === 0 && nextPage) {
      loadPage(nextPage);
    }
  }, [ads.length, nextPage, loadPage]);

  // 3) Infinite scroll: only load more when we already have some ads
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && nextPage && ads.length > 0) {
          loadPage(nextPage);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [ads.length, nextPage, loading, loadPage]);

  if (error) return <p className="page-status page-status-error">{error}</p>;

  return (
    <>
      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder={t("home.searchPlaceholder")}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
        <button
          className="search-btn"
          type="button"
          onClick={() => setSearchQuery(searchDraft.trim())}
        >
          {t("common.search")}
        </button>
      </div>

      <div className="main-content home-ads-grid">
        {ads.map((ad) => (
          <SmallAdCard
            key={ad.uuid}
            ad={ad}
            onDelete={handleDelete}
            onSaveToggle={handleSaveToggle}
            onReport={handleReport}
            showPlaceholderBanner
          />
        ))}

        {!loading && ads.length === 0 && (
          <p className="page-status">{t("home.empty")}</p>
        )}
      </div>

      {loading && ads.length === 0 && <h1>{t("home.loadingInitial")}</h1>}
      <div ref={loaderRef} style={{ height: 20 }} />
    </>
  );
}

export default Home;