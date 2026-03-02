/**
 * Lightweight i18n module — no dependency on react-i18next.
 * Uses React Context to provide translations throughout the app.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import en from "./locales/en.json";
import sn from "./locales/sn.json";
import nd from "./locales/nd.json";

export type Locale = "en" | "sn" | "nd";

const LOCALES: Record<Locale, { label: string; flag: string; data: Record<string, any> }> = {
    en: { label: "English", flag: "🇬🇧", data: en },
    sn: { label: "Shona", flag: "🇿🇼", data: sn },
    nd: { label: "Ndebele", flag: "🇿🇼", data: nd },
};

interface I18nContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: string) => string;
    locales: typeof LOCALES;
}

const I18nContext = createContext<I18nContextType>({
    locale: "en",
    setLocale: () => { },
    t: (k) => k,
    locales: LOCALES,
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        return (localStorage.getItem("locale") as Locale) || "en";
    });

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        localStorage.setItem("locale", l);
        document.documentElement.lang = l === "sn" || l === "nd" ? "sn" : l;
    }, []);

    /** Lookup a dot-separated key like "nav.home" */
    const t = useCallback(
        (key: string): string => {
            const parts = key.split(".");
            let result: any = LOCALES[locale]?.data;
            for (const p of parts) {
                result = result?.[p];
                if (result === undefined) break;
            }
            if (typeof result === "string") return result;
            // Fallback to English
            let fallback: any = LOCALES.en.data;
            for (const p of parts) {
                fallback = fallback?.[p];
                if (fallback === undefined) break;
            }
            return typeof fallback === "string" ? fallback : key;
        },
        [locale]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, locales: LOCALES }}>
            {children}
        </I18nContext.Provider>
    );
}

export const useI18n = () => useContext(I18nContext);
export default I18nProvider;
