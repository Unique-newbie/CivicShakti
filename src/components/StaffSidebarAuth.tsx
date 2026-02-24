"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";
import { clearSessionCookie } from "@/lib/auth-helpers";
import { Models } from "appwrite";
import { LogOut } from "lucide-react";

export function StaffSidebarAuth() {
    const router = useRouter();
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const session = await account.get();
                if (!session.email.endsWith("@civicshakti.gov") && !session.email.endsWith("@civicshakti.com")) {
                    console.error("Unauthorized citizen access attempt");
                    // Optionally log them out of the citizen session if they hit a staff route? 
                    // No, just redirect.
                    router.push("/staff/login?error=unauthorized");
                    return;
                }
                setUser(session);
            } catch (err) {
                console.error("No active staff session", err);
                router.push("/staff/login");
            }
        }
        fetchUser();
    }, [router]);

    const handleLogout = async () => {
        try {
            await account.deleteSession("current");
            clearSessionCookie();
            router.push("/staff/login");
            router.refresh();
        } catch (err) {
            console.error("Staff logout failed", err);
        }
    };

    if (!user) {
        return (
            <div className="p-4 border-t border-slate-800 animate-pulse">
                <div className="h-10 bg-slate-800 rounded mb-2"></div>
                <div className="h-8 bg-slate-800 rounded"></div>
            </div>
        );
    }

    const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

    return (
        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {initial}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name || "Staff Member"}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors text-sm"
            >
                <LogOut className="w-4 h-4" />
                Sign Out
            </button>
        </div>
    );
}
