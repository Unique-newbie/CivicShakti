"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6 mt-auto">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-lg tracking-tight">
                        <ShieldAlert className="w-5 h-5" />
                        <span>CivicShakti</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pr-4">
                        {t("footer.description")}
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">{t("footer.platform")}</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li>
                            <Link href="/about" className="hover:text-blue-700 transition-colors">{t("footer.aboutUs")}</Link>
                        </li>
                        <li>
                            <Link href="/how-it-works" className="hover:text-blue-700 transition-colors">{t("footer.howItWorks")}</Link>
                        </li>
                        <li>
                            <Link href="/faq" className="hover:text-blue-700 transition-colors">{t("footer.faqs")}</Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">{t("footer.legalTrust")}</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li>
                            <Link href="/privacy" className="hover:text-blue-700 transition-colors">{t("footer.privacyPolicy")}</Link>
                        </li>
                        <li>
                            <Link href="/terms" className="hover:text-blue-700 transition-colors">{t("footer.terms")}</Link>
                        </li>
                        <li>
                            <Link href="/accessibility" className="hover:text-blue-700 transition-colors">{t("footer.accessibility")}</Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">{t("footer.support")}</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li>
                            <Link href="/contact" className="hover:text-blue-700 transition-colors">{t("footer.contactSupport")}</Link>
                        </li>
                        <li>
                            <Link href="/track" className="hover:text-blue-700 transition-colors">{t("footer.trackIssue")}</Link>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                    © {new Date().getFullYear()} {t("footer.copyright")}
                </p>
                <div className="flex items-center gap-6">
                    <Link href="/staff/login" className="text-sm text-slate-500 hover:text-blue-700 transition-colors font-medium">
                        {t("nav.authorityPortal")}
                    </Link>
                </div>
            </div>
        </footer>
    );
}
