"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { account, databases, appwriteConfig } from "@/lib/appwrite";
import { Models, Query } from "appwrite";
import {
    Loader2, PlusCircle, Activity, CheckCircle2, Clock,
    MapPin, AlertCircle, ShieldAlert, Search, Map as MapIcon,
    ChevronRight, ArrowUpRight, TrendingUp, Eye, FileText,
    AlertTriangle, Zap, Droplets, Ban, Wind, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientAuthNav } from "@/components/ClientAuthNav";


const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Submitted", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock },
    reviewed: { label: "Under Review", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Eye },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Activity },
    resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    escalated: { label: "Escalated", color: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertTriangle },
};

const CATEGORY_ICONS: Record<string, any> = {
    pothole: AlertTriangle,
    garbage: Ban,
    water: Droplets,
    electricity: Zap,
    pollution: Wind,
    infrastructure: Building2,
};

interface Complaint extends Models.Document {
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    department?: string;
    ai_priority_score?: number;
    $createdAt: string;
}

function formatTimeAgo(dateStr: string) {
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
}

export default function CitizenDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        let isMounted = true;

        async function init() {
            try {
                const session = await account.get();
                if (isMounted) setUser(session);

                const response = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [
                        Query.equal("citizen_contact", session.$id),
                        Query.orderDesc("$createdAt"),
                        Query.limit(100)
                    ]
                );

                if (isMounted) setComplaints(response.documents as unknown as Complaint[]);
            } catch (err) {
                console.error(err);
                if (isMounted) router.push('/login');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        init();

        return () => {
            isMounted = false;
        };
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
                <ShieldAlert className="w-10 h-10 text-blue-600" />
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500 font-medium">Loading your dashboard...</p>
            </div>
        );
    }

    const total = complaints.length;
    const active = complaints.filter(c => ['pending', 'reviewed', 'in_progress', 'escalated'].includes(c.status)).length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const escalated = complaints.filter(c => c.status === 'escalated').length;
    const reviewed = complaints.filter(c => c.status === 'reviewed').length;

    // Filter complaints
    const filteredComplaints = filter === "all"
        ? complaints
        : complaints.filter(c => c.status === filter);

    // Resolution rate
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navbar */}
            <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-blue-700 font-bold text-xl tracking-tight">
                        <ShieldAlert className="w-6 h-6" />
                        <span>CivicShakti</span>
                    </Link>
                    <nav>
                        <ClientAuthNav />
                    </nav>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Welcome back, {user?.name?.split(' ')[0] || 'Citizen'}
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Manage your official municipal reports and track civic resolutions.
                        </p>
                    </div>
                    <Link href="/report">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm shadow-none gap-2 px-6 h-12 text-md">
                            <PlusCircle className="w-5 h-5" />
                            Report New Issue
                        </Button>
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link href="/report" className="group">
                        <div className="rounded-sm border border-slate-200 bg-white p-5 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center gap-4">
                            <div className="w-12 h-12 rounded-sm bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900 text-sm">Submit Report</h3>
                                <p className="text-xs text-slate-500">File a new civic complaint</p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors ml-auto shrink-0" />
                        </div>
                    </Link>
                    <Link href="/track" className="group">
                        <div className="rounded-sm border border-slate-200 bg-white p-5 hover:border-amber-300 hover:bg-amber-50/50 transition-all flex items-center gap-4">
                            <div className="w-12 h-12 rounded-sm bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                                <Search className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900 text-sm">Track by ID</h3>
                                <p className="text-xs text-slate-500">Look up a specific complaint</p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors ml-auto shrink-0" />
                        </div>
                    </Link>
                    <Link href="/explore" className="group">
                        <div className="rounded-sm border border-slate-200 bg-white p-5 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-4">
                            <div className="w-12 h-12 rounded-sm bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                                <MapIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900 text-sm">Explore Map</h3>
                                <p className="text-xs text-slate-500">View issues in your area</p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors ml-auto shrink-0" />
                        </div>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active</span>
                                <Activity className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-3xl font-extrabold text-blue-700">{active}</div>
                            <p className="text-xs text-slate-400 mt-1">Awaiting resolution</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resolved</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="text-3xl font-extrabold text-emerald-700">{resolved}</div>
                            <p className="text-xs text-slate-400 mt-1">{resolutionRate}% resolution rate</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</span>
                                <TrendingUp className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="text-3xl font-extrabold text-slate-900">{total}</div>
                            <p className="text-xs text-slate-400 mt-1">Lifetime submissions</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Escalated</span>
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                            </div>
                            <div className="text-3xl font-extrabold text-rose-600">{escalated}</div>
                            <p className="text-xs text-slate-400 mt-1">Needs attention</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Breakdown Bar */}
                {total > 0 && (
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardContent className="p-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Breakdown</h3>
                            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-0.5">
                                {pending > 0 && (
                                    <div
                                        className="bg-slate-400 rounded-full transition-all"
                                        style={{ width: `${(pending / total) * 100}%` }}
                                        title={`Pending: ${pending}`}
                                    />
                                )}
                                {reviewed > 0 && (
                                    <div
                                        className="bg-amber-400 rounded-full transition-all"
                                        style={{ width: `${(reviewed / total) * 100}%` }}
                                        title={`Reviewed: ${reviewed}`}
                                    />
                                )}
                                {inProgress > 0 && (
                                    <div
                                        className="bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${(inProgress / total) * 100}%` }}
                                        title={`In Progress: ${inProgress}`}
                                    />
                                )}
                                {resolved > 0 && (
                                    <div
                                        className="bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${(resolved / total) * 100}%` }}
                                        title={`Resolved: ${resolved}`}
                                    />
                                )}
                                {escalated > 0 && (
                                    <div
                                        className="bg-rose-500 rounded-full transition-all"
                                        style={{ width: `${(escalated / total) * 100}%` }}
                                        title={`Escalated: ${escalated}`}
                                    />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                                {[
                                    { label: "Pending", count: pending, color: "bg-slate-400" },
                                    { label: "Reviewed", count: reviewed, color: "bg-amber-400" },
                                    { label: "In Progress", count: inProgress, color: "bg-blue-500" },
                                    { label: "Resolved", count: resolved, color: "bg-emerald-500" },
                                    { label: "Escalated", count: escalated, color: "bg-rose-500" },
                                ].filter(s => s.count > 0).map(s => (
                                    <div key={s.label} className="flex items-center gap-2 text-xs text-slate-600">
                                        <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                                        <span>{s.label}: <strong>{s.count}</strong></span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Complaint Records */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Your Complaints</h2>
                        {total > 0 && (
                            <div className="flex gap-1 flex-wrap">
                                {[
                                    { key: "all", label: "All" },
                                    { key: "pending", label: "Pending" },
                                    { key: "in_progress", label: "In Progress" },
                                    { key: "resolved", label: "Resolved" },
                                    { key: "escalated", label: "Escalated" },
                                ].map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilter(f.key)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${filter === f.key
                                            ? "bg-slate-900 text-white"
                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {complaints.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 flex items-center justify-center rounded-full">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-xl font-bold text-slate-900">No complaints yet</h3>
                                <p className="text-slate-500 mt-2">
                                    Your voice matters to the municipality. If you notice infrastructure damages, pollution, or safety hazards in your neighborhood, submit an official report.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <Link href="/report">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm shadow-none gap-2">
                                        <PlusCircle className="w-4 h-4" />
                                        Submit Report
                                    </Button>
                                </Link>
                                <Link href="/explore">
                                    <Button variant="outline" className="rounded-sm shadow-none gap-2 border-slate-200">
                                        <MapIcon className="w-4 h-4" />
                                        Explore Map
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : filteredComplaints.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-sm p-8 text-center">
                            <p className="text-slate-500">No complaints match the selected filter.</p>
                            <button
                                onClick={() => setFilter("all")}
                                className="text-blue-600 text-sm font-medium mt-2 hover:underline"
                            >
                                Clear filter
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                            <div className="divide-y divide-slate-100">
                                {filteredComplaints.map((complaint) => {
                                    const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
                                    const StatusIcon = statusConfig.icon;
                                    const CategoryIcon = CATEGORY_ICONS[complaint.category] || Activity;

                                    return (
                                        <Link
                                            href={`/track/${complaint.tracking_id}`}
                                            key={complaint.$id}
                                            className="block p-5 hover:bg-slate-50 transition-colors group"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4 min-w-0">
                                                    <div className="w-10 h-10 rounded-sm bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-500 group-hover:bg-white transition-colors">
                                                        <CategoryIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className="font-mono text-sm font-bold text-slate-900">
                                                                {complaint.tracking_id}
                                                            </span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className="text-sm font-medium text-slate-500 capitalize">
                                                                {complaint.category}
                                                            </span>
                                                            {complaint.department && (
                                                                <>
                                                                    <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                                                                    <span className="text-xs text-slate-400 hidden sm:inline">
                                                                        → {complaint.department}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <h3 className="text-slate-700 font-medium line-clamp-1 mb-2">
                                                            {complaint.description}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                <span className="truncate max-w-[200px]">{complaint.address || "Location mapped"}</span>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {formatTimeAgo(complaint.$createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t border-slate-100 sm:border-0 pt-3 sm:pt-0 mt-3 sm:mt-0 gap-3">
                                                    <Badge variant="secondary" className={`rounded-sm px-2.5 py-1 ${statusConfig.color} font-semibold transition-colors flex items-center gap-1.5`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                    <div className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                        View <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                            {filteredComplaints.length > 0 && (
                                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-xs text-slate-500 text-center">
                                    Showing {filteredComplaints.length} of {total} complaint{total !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>


        </div>
    );
}
