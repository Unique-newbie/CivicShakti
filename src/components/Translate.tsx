"use client";

import { useLanguage } from "@/context/LanguageContext";

export function Translate({ tKey }: { tKey: string }) {
    const { t } = useLanguage();
    return <>{t(tKey)}</>;
}
