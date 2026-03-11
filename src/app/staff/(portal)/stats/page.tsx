"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users, FileText, ShieldCheck, Shield, UserCheck, TrendingUp,
    Clock, CheckCircle2, AlertTriangle, Activity, Loader2, BarChart3,
    Zap, AlertOctagon, ArrowUpRight
} from "lucide-react";
import { getAuthJWT } from "@/lib/auth-helpers";

interface AppStats {
    users: {
        total: number;
        profiles: number;
        verified: number;
        staff: number;
        newThisWeek: number;
    };
    complaints: {
        total: number;
        resolved: number;
        pending: number;
        inProgress: number;
        escalated: number;
        resolutionRate: number;
        newThisWeek: number;
        newToday: number;
    };
    errors: {
        total: number;
    };
}

export default function AppStatsPage() {
    const [stats, setStats] = useState<AppStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = await getAuthJWT();
            const res = await fetch('/api/staff/app-stats', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch stats");
            }
            setStats(await res.json());
        } catch (error: any) {
            toast.error(error.message || "Failed to load app stats.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center h-[60vh] gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-slate-500 font-medium">Loading app statistics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">App Statistics</h1>
                <p className="text-slate-500 text-lg mt-1">Platform-wide overview of CivicShakti</p>
            </div>

            {/* Users Section */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-500" /> User Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard
                        label="Total Users"
                        value={stats.users.total}
                        icon={Users}
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                    />
                    <StatCard
                        label="Profiles Created"
                        value={stats.users.profiles}
                        icon={FileText}
                        color="text-slate-600"
                        bgColor="bg-slate-50"
                    />
                    <StatCard
                        label="Verified"
                        value={stats.users.verified}
                        icon={UserCheck}
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                    />
                    <StatCard
                        label="Staff Members"
                        value={stats.users.staff}
                        icon={Shield}
                        color="text-purple-600"
                        bgColor="bg-purple-50"
                    />
                    <StatCard
                        label="New This Week"
                        value={stats.users.newThisWeek}
                        icon={TrendingUp}
                        color="text-cyan-600"
                        bgColor="bg-cyan-50"
                        highlight
                    />
                </div>
            </div>

            {/* Complaints Section */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-indigo-500" /> Complaint Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Complaints"
                        value={stats.complaints.total}
                        icon={BarChart3}
                        color="text-slate-600"
                        bgColor="bg-slate-50"
                    />
                    <StatCard
                        label="Pending"
                        value={stats.complaints.pending}
                        icon={Clock}
                        color="text-amber-600"
                        bgColor="bg-amber-50"
                    />
                    <StatCard
                        label="In Progress"
                        value={stats.complaints.inProgress}
                        icon={Activity}
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                    />
                    <StatCard
                        label="Resolved"
                        value={stats.complaints.resolved}
                        icon={CheckCircle2}
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                    />
                    <StatCard
                        label="Escalated"
                        value={stats.complaints.escalated}
                        icon={AlertTriangle}
                        color="text-rose-600"
                        bgColor="bg-rose-50"
                    />
                    <StatCard
                        label="New Today"
                        value={stats.complaints.newToday}
                        icon={Zap}
                        color="text-violet-600"
                        bgColor="bg-violet-50"
                        highlight
                    />
                    <StatCard
                        label="New This Week"
                        value={stats.complaints.newThisWeek}
                        icon={TrendingUp}
                        color="text-cyan-600"
                        bgColor="bg-cyan-50"
                        highlight
                    />
                    <StatCard
                        label="Resolution Rate"
                        value={stats.complaints.resolutionRate}
                        icon={ShieldCheck}
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                        suffix="%"
                    />
                </div>
            </div>

            {/* Resolution Rate Visual */}
            <Card className="border-slate-200 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Complaint Funnel
                    </CardTitle>
                    <CardDescription className="text-xs">How complaints move through the system</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { label: "Pending", count: stats.complaints.pending, color: "bg-amber-500", total: stats.complaints.total },
                            { label: "In Progress", count: stats.complaints.inProgress, color: "bg-blue-500", total: stats.complaints.total },
                            { label: "Resolved", count: stats.complaints.resolved, color: "bg-emerald-500", total: stats.complaints.total },
                            { label: "Escalated", count: stats.complaints.escalated, color: "bg-rose-500", total: stats.complaints.total },
                        ].map(s => (
                            <div key={s.label} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">{s.label}</span>
                                    <span className="font-semibold text-slate-900">
                                        {s.count}
                                        <span className="text-xs text-slate-400 ml-1">
                                            ({s.total > 0 ? Math.round((s.count / s.total) * 100) : 0}%)
                                        </span>
                                    </span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${s.color} rounded-full transition-all duration-700`}
                                        style={{ width: `${s.total > 0 ? (s.count / s.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* System Health */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <AlertOctagon className="w-5 h-5 text-rose-500" /> System Health
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Error Logs"
                        value={stats.errors.total}
                        icon={AlertOctagon}
                        color="text-rose-600"
                        bgColor="bg-rose-50"
                    />
                    <Card className="border-slate-200 shadow-none">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.errors.total === 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                <ShieldCheck className={`w-5 h-5 ${stats.errors.total === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Health</p>
                                <Badge className={`mt-1 ${stats.errors.total === 0 ? 'bg-emerald-100 text-emerald-700' : stats.errors.total < 10 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'} border-0`}>
                                    {stats.errors.total === 0 ? '🟢 Healthy' : stats.errors.total < 10 ? '🟡 Minor Issues' : '🔴 Needs Attention'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bgColor, highlight, suffix }: {
    label: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
    highlight?: boolean;
    suffix?: string;
}) {
    return (
        <Card className={`border-slate-200 shadow-none ${highlight ? 'ring-1 ring-blue-100' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                    <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                </div>
                <div className={`text-2xl font-extrabold ${color}`}>
                    {value}{suffix || ''}
                </div>
            </CardContent>
        </Card>
    );
}
