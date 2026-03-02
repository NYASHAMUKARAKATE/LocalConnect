/**
 * Language Switcher — cycles between English, Shona, and Ndebele.
 * Designed for navigation bar integration.
 */
import { useI18n, type Locale } from "../../i18n";

export default function LanguageSwitcher() {
    const { locale, setLocale, locales } = useI18n();

    const cycleLocale = () => {
        const keys = Object.keys(locales) as Locale[];
        const idx = keys.indexOf(locale);
        const next = keys[(idx + 1) % keys.length];
        setLocale(next);
    };

    return (
        <button
            onClick={cycleLocale}
            title={`Language: ${locales[locale].label}`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "12px",
                border: "1px solid rgba(30, 64, 175, 0.15)",
                background: "rgba(30, 64, 175, 0.05)",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "#1E40AF",
                transition: "all 0.2s",
            }}
        >
            <span style={{ fontSize: "1.1rem" }}>{locales[locale].flag}</span>
            <span>{locale.toUpperCase()}</span>
        </button>
    );
}
