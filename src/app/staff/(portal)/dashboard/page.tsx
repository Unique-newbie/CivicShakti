"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Clock, CheckCircle2, AlertTriangle, Activity, FileDown,
    Loader2, TrendingUp, TrendingDown, Users, Zap,
    ArrowRight, BarChart3, Timer, ShieldAlert, Eye, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { databases, appwriteConfig } from "@/lib/appwrite";
import { downloadCSV } from "@/lib/utils";
import { Query, Models } from "appwrite";
import { toast } from "sonner";

interface Complaint extends Models.Document {
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    department: string;
    citizen_contact: string;
    ai_priority_score?: number;
    upvotes?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
    pending: { label: "Pending", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
    reviewed: { label: "Reviewed", color: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-700" },
    in_progress: { label: "In Progress", color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
    resolved: { label: "Resolved", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
    escalated: { label: "Escalated", color: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700" },
};

const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
};

const formatStatus = (status: string) =>
    status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export default function DashboardOverview() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [Query.orderDesc("$createdAt"), Query.limit(500)]
                );
                setComplaints(res.documents as unknown as Complaint[]);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let pending = 0, inProgress = 0, resolved = 0, escalated = 0;
        let todayCount = 0, weekCount = 0;
        let resolved30d = 0;
        let totalPriority = 0, priorityCount = 0;
        const catCounts: Record<string, number> = {};
        const deptCounts: Record<string, { total: number; resolved: number; escalated: number }> = {};
        const statusCounts: Record<string, number> = {};

        complaints.forEach(c => {
            const created = new Date(c.$createdAt);

            // Status aggregation
            if (c.status === 'pending') pending++;
            else if (c.status === 'in_progress') inProgress++;
            else if (c.status === 'resolved') resolved++;
            else if (c.status === 'escalated') escalated++;

            statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

            if (created >= oneDayAgo) todayCount++;
            if (created >= sevenDaysAgo) weekCount++;
            if (c.status === 'resolved' && created >= thirtyDaysAgo) resolved30d++;

            // AI priority
            if (c.ai_priority_score !== undefined) {
                totalPriority += c.ai_priority_score;
                priorityCount++;
            }

            // Category
            catCounts[c.category] = (catCounts[c.category] || 0) + 1;

            // Department
            const dept = c.department || "Unassigned";
            if (!deptCounts[dept]) deptCounts[dept] = { total: 0, resolved: 0, escalated: 0 };
            deptCounts[dept].total++;
            if (c.status === 'resolved') deptCounts[dept].resolved++;
            if (c.status === 'escalated') deptCounts[dept].escalated++;
        });

        const total = complaints.length || 1;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
        const avgPriority = priorityCount > 0 ? Math.round(totalPriority / priorityCount) : 0;

        // Top categories
        const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
        const colors = ['bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-sky-500'];
        const categoryStats = sortedCats.slice(0, 5).map(([cat, count], i) => ({
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            count,
            percentage: Math.round((count / total) * 100),
            color: colors[i % colors.length]
        }));

        // Department perf
        const deptStats = Object.entries(deptCounts)
            .map(([name, data]) => ({
                name,
                ...data,
                rate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0
            }))
            .sort((a, b) => b.total - a.total);

        // Recent high-priority
        const recentHighPriority = complaints
            .filter(c => c.status !== 'resolved' && (c.ai_priority_score || 0) >= 60)
            .slice(0, 5);

        return {
            pending, inProgress, resolved, escalated,
            todayCount, weekCount, resolved30d,
            resolutionRate, avgPriority,
            categoryStats, deptStats,
            recentHighPriority,
            statusCounts,
            recentList: complaints.slice(0, 8),
            total: complaints.length
        };
    }, [complaints]);

    const handleExport = () => {
        const exportData = complaints.map(c => ({
            TrackingID: c.tracking_id,
            Category: c.category,
            User: c.citizen_contact || "Anonymous",
            Location: c.address,
            Department: c.department,
            Status: c.status,
            Priority: c.ai_priority_score || "N/A",
            Description: c.description,
            CreatedAt: new Date(c.$createdAt).toLocaleString()
        }));
        downloadCSV(exportData, `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success("Dashboard report exported");
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500 font-medium">Loading dashboard data...</p>
            </div>
        );
    }

    const METRICS = [
        { title: "Total Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-100", description: "Awaiting triage" },
        { title: "In Progress", value: stats.inProgress, icon: Activity, color: "text-blue-600", bg: "bg-blue-100", description: "Being handled" },
        { title: "Resolved (30d)", value: stats.resolved30d, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100", description: `${stats.resolutionRate}% rate` },
        { title: "Escalated", value: stats.escalated, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100", description: "Needs attention" },
        { title: "New Today", value: stats.todayCount, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-100", description: `${stats.weekCount} this week` },
        { title: "Avg AI Priority", value: stats.avgPriority, icon: Zap, color: "text-purple-600", bg: "bg-purple-100", description: "Across all reports" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Command Center</h1>
                    <p className="text-slate-500 mt-1">Real-time operational overview — {stats.total} complaints tracked.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <FileDown className="w-4 h-4" /> Export
                    </Button>
                    <Button className="gap-2 bg-blue-700 hover:bg-blue-800" onClick={() => router.push('/staff/complaints')}>
                        <Eye className="w-4 h-4" /> View All
                    </Button>
                </div>
            </div>

            {/* Escalation Alert */}
            {stats.escalated > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-sm p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-rose-100 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-rose-900">{stats.escalated} Escalated Complaint{stats.escalated > 1 ? 's' : ''}</p>
                            <p className="text-sm text-rose-600">Require immediate senior review and resolution.</p>
                        </div>
                    </div>
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => router.push('/staff/complaints')}>
                        Review Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {METRICS.map((m) => (
                    <Card key={m.title} className="bg-white rounded-sm border-slate-200 shadow-none hover:border-slate-300 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.title}</p>
                                <div className={`p-1.5 rounded-sm ${m.bg}`}>
                                    <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">{m.value}</h2>
                            <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Complaints + Status Breakdown */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Status Distribution Bar */}
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-slate-400" /> Status Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden mb-4">
                                {Object.entries(stats.statusCounts).map(([status, count]) => {
                                    const cfg = STATUS_CONFIG[status];
                                    if (!cfg) return null;
                                    const pct = ((count as number) / (stats.total || 1)) * 100;
                                    return <div key={status} className={`h-full ${cfg.color}`} style={{ width: `${pct}%` }} title={`${cfg.label}: ${count}`} />;
                                })}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(stats.statusCounts).map(([status, count]) => {
                                    const cfg = STATUS_CONFIG[status];
                                    if (!cfg) return null;
                                    return (
                                        <div key={status} className="flex items-center gap-2 text-sm">
                                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                                            <span className="text-slate-600">{cfg.label}</span>
                                            <span className="font-semibold text-slate-900">{count as number}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Complaints */}
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <CardTitle className="text-base font-semibold text-slate-900">Recent Complaints</CardTitle>
                                <CardDescription>Latest issues across all departments.</CardDescription>
                            </div>
                            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => router.push("/staff/complaints")}>
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {stats.recentList.length > 0 ? stats.recentList.map((item) => {
                                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                                    return (
                                        <div
                                            key={item.$id}
                                            onClick={() => router.push(`/staff/complaints/${item.tracking_id}`)}
                                            className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        >
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.color}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-semibold text-slate-900">#{item.tracking_id}</span>
                                                    <span className="text-sm text-slate-600 capitalize truncate">{item.category}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 truncate">{item.address || "No location"}</p>
                                            </div>
                                            <Badge variant="secondary" className={`text-xs ${cfg.bg} ${cfg.text} shrink-0`}>
                                                {cfg.label}
                                            </Badge>
                                            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{formatTimeAgo(item.$createdAt)}</span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                                        </div>
                                    );
                                }) : (
                                    <div className="px-6 py-8 text-center text-slate-500">No complaints found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">

                    {/* Category Breakdown */}
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                                Top Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {stats.categoryStats.length > 0 ? stats.categoryStats.map(cat => (
                                <div key={cat.name}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-slate-700 font-medium capitalize">{cat.name}</span>
                                        <span className="text-slate-500 text-xs">{cat.count} ({cat.percentage}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${cat.percentage}%` }} />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-sm text-center text-slate-500 py-4">No data available yet.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Department Performance */}
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                                Department Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {stats.deptStats.length > 0 ? stats.deptStats.slice(0, 5).map(dept => (
                                <div key={dept.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-sm border border-slate-100">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{dept.name}</p>
                                        <p className="text-xs text-slate-500">{dept.total} total · {dept.resolved} resolved</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${dept.rate >= 70 ? 'text-emerald-600' : dept.rate >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                                            {dept.rate}%
                                        </p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Resolution</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-sm text-center text-slate-500 py-4">No department data available.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* High Priority Queue */}
                    {stats.recentHighPriority.length > 0 && (
                        <Card className="rounded-sm bg-slate-900 text-white shadow-none border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-slate-300">
                                    <Zap className="w-4 h-4 text-amber-400" /> High Priority Queue
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {stats.recentHighPriority.map(item => (
                                    <div
                                        key={item.$id}
                                        onClick={() => router.push(`/staff/complaints/${item.tracking_id}`)}
                                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-sm hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                        <div>
                                            <p className="text-sm font-mono font-semibold text-white">#{item.tracking_id}</p>
                                            <p className="text-xs text-slate-400 capitalize">{item.category}</p>
                                        </div>
                                        <Badge className={`text-xs shrink-0 ${(item.ai_priority_score || 0) >= 80 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                            <Zap className="w-3 h-3 mr-1" /> {item.ai_priority_score}/100
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => router.push('/staff/heatmap')}
                            className="p-4 bg-white rounded-sm border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
                        >
                            <BarChart3 className="w-5 h-5 text-blue-500 mb-2" />
                            <p className="text-sm font-semibold text-slate-800">Heatmap</p>
                            <p className="text-xs text-slate-400">View clusters</p>
                        </button>
                        <button
                            onClick={() => router.push('/staff/errors')}
                            className="p-4 bg-white rounded-sm border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 transition-all text-left group"
                        >
                            <AlertTriangle className="w-5 h-5 text-rose-500 mb-2" />
                            <p className="text-sm font-semibold text-slate-800">Errors</p>
                            <p className="text-xs text-slate-400">System health</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
