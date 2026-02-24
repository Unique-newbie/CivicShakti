"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    MapPin,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Activity,
    Filter,
    FileDown,
    Loader2
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
}

// Status styling mapping
const getStatusClasses = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
        case 'reviewed': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
        case 'in_progress': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
        case 'resolved': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
        case 'escalated': return 'bg-rose-100 text-rose-800 hover:bg-rose-200';
        default: return 'bg-slate-100 text-slate-800';
    }
};

const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

export default function DashboardOverview() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch latest 500 complaints for aggregate metrics
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

    const {
        totalPending,
        resolved30d,
        escalated,
        newToday,
        recentList,
        categoryStats,
        escalatedCount
    } = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        let pendingCount = 0;
        let resolvedCount = 0;
        let escalatedCount = 0;
        let todayCount = 0;

        const catCounts: Record<string, number> = {};

        complaints.forEach(c => {
            const createdAt = new Date(c.$createdAt);

            if (c.status === 'pending') pendingCount++;
            if (c.status === 'escalated') escalatedCount++;
            if (c.status === 'resolved' && createdAt >= thirtyDaysAgo) resolvedCount++;
            if (createdAt >= oneDayAgo) todayCount++;

            catCounts[c.category] = (catCounts[c.category] || 0) + 1;
        });

        // Top 4 categories and 'Other'
        const totalCount = complaints.length || 1; // prevent divide by zero
        const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

        const stats: { name: string, percentage: number, color?: string }[] = sortedCats.slice(0, 4).map(([cat, count]) => ({
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            percentage: Math.round((count / totalCount) * 100)
        }));

        if (sortedCats.length > 4) {
            const otherCount = sortedCats.slice(4).reduce((acc, [, count]) => acc + count, 0);
            stats.push({ name: 'Other', percentage: Math.round((otherCount / totalCount) * 100) });
        }

        // Colors for categories
        const colors = ['bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-slate-500'];
        const coloredStats = stats.map((s, i) => ({ ...s, color: colors[i % colors.length] }));

        return {
            totalPending: pendingCount,
            resolved30d: resolvedCount,
            escalated: escalatedCount,
            newToday: todayCount,
            recentList: complaints.slice(0, 5),
            categoryStats: coloredStats,
            escalatedCount
        };
    }, [complaints]);

    const METRICS = [
        {
            title: "Total Pending",
            value: totalPending.toString(),
            change: "Live",
            trend: "up",
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-100",
        },
        {
            title: "Resolved (30d)",
            value: resolved30d.toString(),
            change: "Live",
            trend: "up",
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-100",
        },
        {
            title: "Escalated",
            value: escalated.toString(),
            change: "Live",
            trend: "down",
            icon: AlertTriangle,
            color: "text-rose-600",
            bg: "bg-rose-100",
        },
        {
            title: "New Today",
            value: newToday.toString(),
            change: "Live",
            trend: "up",
            icon: Activity,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
    ];

    const handleExport = () => {
        const exportData = complaints.map(c => ({
            ID: c.$id,
            TrackingID: c.tracking_id,
            Category: c.category,
            User: c.citizen_contact || "Anonymous",
            Location: c.address,
            Department: c.department,
            Status: c.status,
            Description: c.description,
            CreatedAt: new Date(c.$createdAt).toLocaleString()
        }));
        downloadCSV(exportData, `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success("Dashboard report exported successfully");
    };

    const router = useRouter();

    const handleFilter = () => {
        router.push('/staff/complaints');
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">Real-time metrics for Central Ward jurisdiction.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <FileDown className="w-4 h-4" />
                        Export Report
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleFilter}>
                        <Filter className="w-4 h-4" />
                        Filter Data
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {METRICS.map((metric) => (
                    <Card key={metric.title} className="bg-white rounded-sm border-slate-300 shadow-none">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0">
                                <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                                <div className={`p-2 rounded-lg ${metric.bg}`}>
                                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-baseline gap-2">
                                <h2 className="text-3xl font-bold text-slate-900">{metric.value}</h2>
                                <span className={`text-xs font-medium flex items-center ${metric.trend === 'up' && metric.color !== 'text-rose-600' ? 'text-emerald-600' : metric.trend === 'down' && metric.color === 'text-rose-600' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {metric.change}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* Recent Complaints Table */}
                <Card className="lg:col-span-2 rounded-sm border-slate-300 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">Recent Complaints</CardTitle>
                            <CardDescription>Latest issues needing attention.</CardDescription>
                        </div>
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => router.push("/staff/complaints")}>
                            View All
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-100">Tracking ID</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Issue</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Department</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Status</th>
                                        <th className="px-6 py-4 border-b border-slate-100 text-right">Time Logged</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentList.length > 0 ? recentList.map((item) => (
                                        <tr key={item.$id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {item.tracking_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800 capitalize">{item.category}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                    <span className="truncate max-w-[200px]">{item.address || "No address"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 font-medium text-sm">
                                                {item.department || "Unassigned"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="secondary"
                                                    className={getStatusClasses(item.status)}
                                                >
                                                    {formatStatus(item.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                                                {formatTimeAgo(item.$createdAt)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                No complaints found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Panel / Quick Filters */}
                <div className="space-y-6">
                    {escalatedCount > 0 && (
                        <Card className="rounded-sm bg-slate-900 text-white shadow-none border-slate-800 animate-in slide-in-from-right-4">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                                    Attention Required
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                                    You have <strong className="text-white">{escalatedCount} Escalated Complaints</strong> in your jurisdiction requiring immediate resolution or triage.
                                </p>
                                <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white border-0 transition-colors" onClick={() => router.push("/staff/complaints")}>
                                    Review Escalations
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="rounded-sm border-slate-300 shadow-none">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                                Category Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {categoryStats.length > 0 ? (
                                <>
                                    {categoryStats.map(stat => (
                                        <div key={stat.name} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${stat.color}`}></div> {stat.name}
                                            </span>
                                            <span className="font-medium">{stat.percentage}%</span>
                                        </div>
                                    ))}

                                    <div className="h-2 w-full bg-slate-100 rounded-full mt-2 flex overflow-hidden">
                                        {categoryStats.map(stat => (
                                            <div key={stat.name} className={`h-full ${stat.color}`} style={{ width: `${stat.percentage}%` }}></div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-center text-slate-500 py-4">
                                    No category data available yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
