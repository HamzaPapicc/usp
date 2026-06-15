import { useLanguage } from "../context/LanguageContext";

function SidebarFilters({ filters, setFilters }) {
    const { t } = useLanguage();

    const positionTypes = [
        { value: "waiter", label: t("createAd.waiter") },
        { value: "bartender", label: t("createAd.bartender") },
        { value: "chef", label: t("createAd.chef") },
        { value: "driver", label: t("createAd.driver") },
        { value: "truck_driver", label: t("createAd.truckDriver") },
        { value: "cashier", label: t("createAd.cashier") },
        { value: "delivery", label: t("createAd.delivery") },
        { value: "warehouse_worker", label: t("createAd.warehouseWorker") },
        { value: "janitor", label: t("createAd.janitor") },
    ];

    const togglePositionType = (type) => {
        setFilters((prev) => {
            const exists = prev.position_type.includes(type);

            return {
                ...prev,
                position_type: exists
                    ? prev.position_type.filter((value) => value !== type)
                    : [...prev.position_type, type],
            };
        });
    };

    const clearPositionTypes = () => {
        setFilters((prev) => ({
            ...prev,
            position_type: [],
        }));
    };

    return (
        <div className="sidebar-filters">
            <p className="sidebar-filters-title">{t("filters.positionTitle")}</p>

            {positionTypes.map(({ value, label }) => (
                <label className="sidebar-filter-option" key={value}>
                    <input
                        type="checkbox"
                        checked={filters.position_type.includes(value)}
                        onChange={() => togglePositionType(value)}
                    />
                    {label}
                </label>
            ))}

            {filters.position_type.length > 0 && (
                <button type="button" className="side-menu-btn sidebar-clear-btn" onClick={clearPositionTypes}>
                    {t("filters.clear")}
                </button>
            )}
        </div>
    );
}

export default SidebarFilters;
