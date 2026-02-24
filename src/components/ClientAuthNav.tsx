"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { account } from "@/lib/appwrite";
import { clearSessionCookie } from "@/lib/auth-helpers";
import { Models } from "appwrite";
import { LogOut, User, LayoutDashboard } from "lucide-react";

export function ClientAuthNav() {
    const router = useRouter();
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkSession() {
            try {
                const session = await account.get();
                setUser(session);
            } catch (err) {
                // Not logged in
            } finally {
                setIsLoading(false);
            }
        }
        checkSession();
    }, []);

    const handleLogout = async () => {
        try {
            await account.deleteSession("current");
            clearSessionCookie();
            setUser(null);
            router.refresh();
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    if (isLoading) {
        return <div className="w-32 h-9 animate-pulse bg-slate-200 rounded-md"></div>;
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-sm text-slate-700 font-medium hover:text-blue-600 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                </Link>
                <Link href="/profile" className="hidden sm:flex items-center gap-2 text-sm text-slate-700 font-medium hover:text-blue-600 transition-colors">
                    <User className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{user.name || user.email}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-600 gap-2 border-slate-200 hover:bg-slate-100">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
                <div className="h-6 w-px bg-slate-200"></div>
                <Link href="/staff/dashboard">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
                        Authority Portal
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Link href="/login">
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 font-medium">
                    Citizen Login
                </Button>
            </Link>
            <Link href="/staff/login">
                <Button variant="ghost" className="text-slate-600 font-medium">
                    Authority Portal
                </Button>
            </Link>
        </div>
    );
}
