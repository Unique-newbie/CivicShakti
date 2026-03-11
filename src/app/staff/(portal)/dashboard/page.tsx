"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Loader2, Activity, CheckCircle2, Clock, AlertTriangle, TrendingUp,
    ShieldAlert, Eye, BarChart3, Users, MapPin, Zap, Building2, ArrowUpRight, Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthJWT } from "@/lib/auth-helpers";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const LEVEL_LABELS: Record<string, string> = {
    superadmin: "Super Admin",
    state: "State Administrator",
    city: "City Administrator",
    village: "Village Administrator",
    ward: "Ward Officer",
};

const LEVEL_COLORS: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-700 border-purple-200",
    state: "bg-indigo-100 text-indigo-700 border-indigo-200",
    city: "bg-blue-100 text-blue-700 border-blue-200",
    village: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ward: "bg-amber-100 text-amber-700 border-amber-200",
};

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#6366f1"];

const SUBUNIT_LABELS: Record<string, string> = {
    superadmin: "States",
    state: "Cities",
    city: "Villages",
    village: "Wards",
};

interface DashboardStats {
    adminLevel: string;
    jurisdiction: string;
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    escalated: number;
    newToday: number;
    recent: any[];
    categoryDistribution: { name: string; value: number }[];
    urgencyBreakdown: Record<string, number>;
    subUnits: { name: string; total: number; resolved: number; rate: number }[];
}

export default function StaffDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const token = await getAuthJWT();
            if (!token) return;
            try {
                const res = await fetch("/api/staff/dashboard-stats", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setStats(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center h-[60vh] gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-slate-500 font-medium">Loading dashboard...</span>
            </div>
        );
    }

    const { adminLevel, jurisdiction, total, pending, inProgress, resolved, escalated, newToday, recent, categoryDistribution, subUnits, slaBreached, slaWarning } = stats as any;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h1>
                        <Badge className={`${LEVEL_COLORS[adminLevel] || "bg-slate-100 text-slate-600"} font-semibold px-3 py-1`}>
                            {LEVEL_LABELS[adminLevel] || adminLevel}
                        </Badge>
                    </div>
                    <p className="text-slate-500 text-lg">
                        {jurisdiction ? `Jurisdiction: ${jurisdiction}` : "Real-time operational overview"} — {total} complaint{total !== 1 ? "s" : ""} tracked.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/staff/complaints">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Eye className="w-4 h-4" /> View All
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <KPICard label="Total" value={total} icon={BarChart3} color="text-slate-600" desc="All time" />
                <KPICard label="Pending" value={pending} icon={Clock} color="text-amber-600" desc="Awaiting triage" />
                <KPICard label="In Progress" value={inProgress} icon={Activity} color="text-blue-600" desc="Being handled" />
                <KPICard label="Resolved" value={resolved} icon={CheckCircle2} color="text-emerald-600" desc={`${resolutionRate}% rate`} />
                <KPICard label="Escalated" value={escalated} icon={AlertTriangle} color="text-rose-600" desc="Needs attention" />
                <KPICard label="New Today" value={newToday} icon={Zap} color="text-purple-600" desc="Today" />
                <KPICard label="SLA Breached" value={slaBreached || 0} icon={Timer} color="text-red-600" desc="Overdue" />
                <KPICard label="SLA Warning" value={slaWarning || 0} icon={ShieldAlert} color="text-orange-600" desc="Nearing deadline" />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <Card className="border-slate-200 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            Category Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryDistribution.length > 0 ? (
                            <div className="flex items-center gap-4">
                                <ResponsiveContainer width="50%" height={200}>
                                    <PieChart>
                                        <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                                            {categoryDistribution.map((_: any, i: number) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex-1 space-y-2">
                                    {categoryDistribution.map((cat: any, i: number) => (
                                        <div key={cat.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <span className="text-slate-600 capitalize">{cat.name}</span>
                                            </div>
                                            <span className="font-semibold text-slate-900">{cat.value} <span className="text-xs text-slate-400">({total > 0 ? Math.round((cat.value / total) * 100) : 0}%)</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm py-8 text-center">No complaint data yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Sub-unit Performance */}
                {subUnits.length > 0 && (
                    <Card className="border-slate-200 shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                {SUBUNIT_LABELS[adminLevel] || "Sub-unit"} Performance
                            </CardTitle>
                            <CardDescription className="text-xs">Complaints by {(SUBUNIT_LABELS[adminLevel] || "sub-unit").toLowerCase()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={subUnits} layout="vertical" margin={{ left: 10, right: 10 }}>
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total" name="Total" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Urgency Heatmap (if no sub-units, show urgency) */}
                {subUnits.length === 0 && (
                    <Card className="border-slate-200 shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                Status Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    { label: "Pending", count: pending, color: "bg-amber-500", total },
                                    { label: "In Progress", count: inProgress, color: "bg-blue-500", total },
                                    { label: "Resolved", count: resolved, color: "bg-emerald-500", total },
                                    { label: "Escalated", count: escalated, color: "bg-rose-500", total },
                                ].map(s => (
                                    <div key={s.label} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">{s.label}</span>
                                            <span className="font-semibold">{s.count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.total > 0 ? (s.count / s.total) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── Sub-unit Table (for higher admins) ── */}
            {subUnits.length > 0 && (
                <Card className="border-slate-200 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            {SUBUNIT_LABELS[adminLevel] || "Sub-unit"} Comparison
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Resolved</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Resolution Rate</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {subUnits.map((su: any) => (
                                    <tr key={su.name} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{su.name}</td>
                                        <td className="px-4 py-4 text-center text-slate-600">{su.total}</td>
                                        <td className="px-4 py-4 text-center text-emerald-600 font-semibold">{su.resolved}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${su.rate >= 70 ? "bg-emerald-500" : su.rate >= 40 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${su.rate}%` }} />
                                                </div>
                                                <span className="text-xs font-semibold">{su.rate}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Badge variant="secondary" className={`text-xs ${su.rate >= 70 ? "bg-emerald-100 text-emerald-700" : su.rate >= 40 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                                                {su.rate >= 70 ? "Good" : su.rate >= 40 ? "Needs Improvement" : "Critical"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* ── Recent Complaints ── */}
            <Card className="border-slate-200 shadow-none">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            Recent Complaints
                        </CardTitle>
                        <Link href="/staff/complaints">
                            <Button variant="ghost" size="sm" className="text-blue-600 gap-1 text-xs">
                                View All <ArrowUpRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {recent.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No complaints in your jurisdiction yet.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recent.map((c: any) => {
                                const statusColor = c.status === "Resolved" ? "bg-emerald-100 text-emerald-700" :
                                    c.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                                        c.status === "Escalated" ? "bg-rose-100 text-rose-700" :
                                            "bg-amber-100 text-amber-700";
                                return (
                                    <Link href={`/staff/complaints/${c.ticketId}`} key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <span className="font-mono text-sm font-bold text-slate-900">#{c.ticketId}</span>
                                            <span className="text-sm text-slate-600 capitalize truncate">{c.category}</span>
                                            <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
                                                <MapPin className="w-3 h-3" />
                                                {c.ward?.name || c.village?.name || c.city?.name || "—"}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <Badge variant="secondary" className={`text-xs ${statusColor}`}>{c.status}</Badge>
                                            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function KPICard({ label, value, icon: Icon, color, desc }: { label: string; value: number; icon: any; color: string; desc: string }) {
    return (
        <Card className="border-slate-200 shadow-none">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </CardContent>
        </Card>
    );
}
