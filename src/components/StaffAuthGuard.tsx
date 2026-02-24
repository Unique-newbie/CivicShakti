"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * Guards staff routes by verifying the user's email domain.
 * Shows a loading spinner while checking. Redirects non-staff users
 * to the staff login page.
 */
export function StaffAuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        account.get()
            .then((user) => {
                if (
                    user.email.endsWith("@civicshakti.gov") ||
                    user.email.endsWith("@civicshakti.com")
                ) {
                    setIsAuthorized(true);
                } else {
                    // Citizen is logged in but doesn't have staff access
                    router.replace("/staff/login");
                }
            })
            .catch(() => {
                // Not logged in at all
                router.replace("/staff/login");
            })
            .finally(() => {
                setIsChecking(false);
            });
    }, [router]);

    if (isChecking || !isAuthorized) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="flex items-center gap-2 text-blue-700">
                    <ShieldAlert className="w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight">CivicShakti</span>
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">Verifying staff credentials...</p>
            </div>
        );
    }

    return <>{children}</>;
}
