"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function TrackPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [trackingId, setTrackingId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId.trim()) return;

        setIsLoading(true);
        router.push(`/track/${trackingId.toUpperCase()}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <PublicHeader />

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-sm shadow-none overflow-hidden border border-slate-300 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 md:p-8">
                        <div className="mb-6">
                            <BackButton fallbackHref="/" label="Back to Home" />
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">{t("track.title")}</h1>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            {t("track.subtitle")}
                        </p>

                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    placeholder={t("track.placeholder")}
                                    value={trackingId}
                                    onChange={(e) => setTrackingId(e.target.value)}
                                    className="pl-10 h-14 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    autoFocus
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg rounded-sm rounded-sm bg-slate-900 hover:bg-slate-800 text-white shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={!trackingId.trim() || isLoading}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : t("track.btn")}
                            </Button>
                        </form>
                    </div>

                    <div className="bg-slate-50 p-6 border-t border-slate-200 text-center text-sm text-slate-500">
                        Lost your tracking ID? <a href="mailto:support@civicshakti.com" className="text-blue-600 font-medium hover:underline hover:text-blue-700">Contact Support</a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
