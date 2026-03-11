"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BackButtonProps {
    fallbackHref?: string;
    label?: React.ReactNode;
    className?: string;
}

export function BackButton({ fallbackHref = "/", label, className = "" }: BackButtonProps) {
    const router = useRouter();
    const { t } = useLanguage();

    const handleBack = () => {
        // Check if there's browser history to go back to
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push(fallbackHref);
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-700 font-medium transition-colors group ${className}`}
        >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {label || t("common.back")}
        </button>
    );
}
