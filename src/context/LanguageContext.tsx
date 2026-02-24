"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, t } from "@/lib/translations";

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: "en",
    setLang: () => { },
    t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>("en");

    useEffect(() => {
        const saved = localStorage.getItem("civicshakti_lang") as Language | null;
        if (saved === "en" || saved === "hi") {
            setLangState(saved);
        }
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem("civicshakti_lang", newLang);
    };

    const translate = (key: string) => t(key, lang);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
