"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Menu, X, Globe } from "lucide-react";
import { ClientAuthNav } from "./ClientAuthNav";
import { useLanguage } from "@/context/LanguageContext";

const NAV_LINKS = [
    { href: "/explore", labelKey: "nav.explore" },
    { href: "/report", labelKey: "nav.report" },
    { href: "/track", labelKey: "nav.track" },
    { href: "/how-it-works", labelKey: "nav.howItWorks" },
];

export function PublicHeader() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const { lang, setLang, t } = useLanguage();

    const toggleLang = () => setLang(lang === "en" ? "hi" : "en");

    return (
        <>
            <header className="px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex-none z-50 sticky top-0">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 text-blue-700 font-bold text-xl tracking-tight transition-opacity hover:opacity-80 shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                        <span>CivicShakti</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 mx-8">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                        }`}
                                >
                                    {t(link.labelKey)}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center gap-2">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLang}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
                            title={lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
                        >
                            <Globe className="w-4 h-4" />
                            <span className="hidden sm:inline">{lang === "en" ? "हिं" : "EN"}</span>
                        </button>

                        {/* Auth Nav — Desktop */}
                        <div className="hidden md:block">
                            <ClientAuthNav />
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 md:hidden shadow-2xl animate-in slide-in-from-right duration-200">
                        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100">
                            <span className="text-blue-700 font-bold text-lg flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5" />
                                Menu
                            </span>
                            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="p-4 space-y-1">
                            {NAV_LINKS.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        {t(link.labelKey)}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="border-t border-slate-100 p-4">
                            <ClientAuthNav />
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
