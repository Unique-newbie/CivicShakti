"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAuthJWT, clearSessionCookie } from "@/lib/auth-helpers";
import { LogOut, User, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role: string;
}

export function ClientAuthNav() {
    const router = useRouter();
    const { t } = useLanguage();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        async function checkSession() {
            try {
                const token = await getAuthJWT();
                if (!token) return;
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch {
                // Not logged in
            } finally {
                setIsLoading(false);
            }
        }
        checkSession();
    }, []);

    const handleLogout = async () => {
        try {
            const { account } = await import('@/lib/appwrite');
            await account.deleteSession('current');
        } catch { /* ignore */ }
        clearSessionCookie();
        setUser(null);
        setShowLogoutConfirm(false);
        router.refresh();
    };

    if (isLoading) {
        return <div className="w-32 h-9 animate-pulse bg-slate-200 rounded-md"></div>;
    }

    if (user) {
        return (
            <>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-sm text-slate-700 font-medium hover:text-blue-600 transition-colors">
                        <LayoutDashboard className="w-4 h-4" />
                        {t("nav.dashboard")}
                    </Link>
                    <Link href="/profile" className="hidden sm:flex items-center gap-2 text-sm text-slate-700 font-medium hover:text-blue-600 transition-colors">
                        <User className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{user.name || user.email}</span>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(true)} className="text-slate-600 gap-2 border-slate-200 hover:bg-slate-100">
                        <LogOut className="w-4 h-4" />
                        {t("nav.signOut")}
                    </Button>
                    {user.role === 'staff' && (
                        <>
                            <div className="h-6 w-px bg-slate-200"></div>
                            <Link href="/staff/dashboard">
                                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
                                    {t("nav.authorityPortal")}
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Logout Confirmation Dialog */}
                {showLogoutConfirm && (
                    <>
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" onClick={() => setShowLogoutConfirm(false)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm">
                            <div className="bg-white rounded-lg shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                                        <LogOut className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Sign Out?</h3>
                                        <p className="text-sm text-slate-500">Are you sure you want to sign out of your account?</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(false)} className="border-slate-200">
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleLogout} className="bg-rose-600 hover:bg-rose-700 text-white">
                                        Sign Out
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Link href="/login">
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 font-medium">
                    {t("nav.citizenLogin")}
                </Button>
            </Link>
            <Link href="/staff/login">
                <Button variant="ghost" className="text-slate-600 font-medium">
                    {t("nav.authorityPortal")}
                </Button>
            </Link>
        </div>
    );
}
