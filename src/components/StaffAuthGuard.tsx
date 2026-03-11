"use client";

import { useEffect, useState } from "react";
import { getAuthJWT } from "@/lib/auth-helpers";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * Guards staff routes client-side. The server-side middleware in middleware.ts
 * handles the actual redirect for unauthenticated users. This component just
 * shows a loading state while verifying the session on the client, then
 * renders children once confirmed.
 */
export function StaffAuthGuard({ children }: { children: React.ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            const token = await getAuthJWT();
            if (!token) return; // middleware will redirect
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const user = await res.json();
                    if (user?.role === 'staff') {
                        setIsAuthorized(true);
                    } else {
                        window.location.href = '/staff/login?error=Unauthorized';
                    }
                } else {
                    window.location.href = '/staff/login?error=SessionExpired';
                }
            } catch {
                // middleware will handle redirect
            }
        }
        checkAuth();
    }, []);

    if (!isAuthorized) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="flex items-center gap-2 text-blue-700">
                    <ShieldAlert className="w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight">CivicShakti</span>
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">Loading portal...</p>
            </div>
        );
    }

    return <>{children}</>;
}
