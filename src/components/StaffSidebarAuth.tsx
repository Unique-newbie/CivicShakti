"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthJWT, clearSessionCookie } from "@/lib/auth-helpers";
import { LogOut, Shield, MapPin, Building2, Map, Globe, Crown } from "lucide-react";

interface StaffUser {
    id: string;
    email: string;
    name?: string;
    role: string;
    profile?: {
        adminLevel?: string;
        fullName?: string;
    };
}

const LEVEL_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    superadmin: { label: "Super Admin", icon: Crown, color: "text-purple-400", bg: "bg-purple-500/20" },
    state: { label: "State Admin", icon: Globe, color: "text-indigo-400", bg: "bg-indigo-500/20" },
    city: { label: "City Admin", icon: Building2, color: "text-blue-400", bg: "bg-blue-500/20" },
    village: { label: "Village Admin", icon: Map, color: "text-emerald-400", bg: "bg-emerald-500/20" },
    ward: { label: "Ward Officer", icon: MapPin, color: "text-amber-400", bg: "bg-amber-500/20" },
};

export function StaffSidebarAuth() {
    const router = useRouter();
    const [user, setUser] = useState<StaffUser | null>(null);
    const [jurisdiction, setJurisdiction] = useState("");

    useEffect(() => {
        async function fetchUser() {
            try {
                const token = await getAuthJWT();
                if (!token) return;
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data?.role === 'staff') {
                    setUser(data);
                }

                // Also fetch jurisdiction from dashboard stats
                const statsRes = await fetch('/api/staff/dashboard-stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    setJurisdiction(stats.jurisdiction || '');
                }
            } catch (err) {
                console.error("Failed to load staff user", err);
            }
        }
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            const { account } = await import('@/lib/appwrite');
            await account.deleteSession('current');
        } catch { /* ignore */ }
        clearSessionCookie();
        router.push("/staff/login");
        router.refresh();
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
    const adminLevel = user.profile?.adminLevel || "none";
    const levelConfig = LEVEL_CONFIG[adminLevel];
    const LevelIcon = levelConfig?.icon || Shield;

    return (
        <div className="p-4 border-t border-slate-800 space-y-3">
            {/* Admin Level Badge */}
            {levelConfig && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${levelConfig.bg}`}>
                    <LevelIcon className={`w-4 h-4 ${levelConfig.color}`} />
                    <div className="min-w-0">
                        <p className={`text-xs font-bold ${levelConfig.color} uppercase tracking-wider`}>{levelConfig.label}</p>
                        {jurisdiction && (
                            <p className="text-[10px] text-slate-400 truncate">{jurisdiction}</p>
                        )}
                    </div>
                </div>
            )}

            {/* User Info */}
            <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {initial}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name || "Staff Member"}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors text-sm"
            >
                <LogOut className="w-4 h-4" />
                Sign Out
            </button>
        </div>
    );
}
