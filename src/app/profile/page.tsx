"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { account, databases, appwriteConfig } from "@/lib/appwrite";
import { Models, Query } from "appwrite";
import {
    Loader2, User, ShieldCheck, Mail, Bell, FileText, Lock, Activity,
    ShieldAlert, BadgeCheck, AlertCircle, Calendar, Hash, Clock,
    CheckCircle2, AlertTriangle, TrendingUp, Copy, ChevronRight,
    MapPin, Eye, Zap, Award, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientAuthNav } from "@/components/ClientAuthNav";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";

interface Profile extends Models.Document {
    user_id: string;
    trust_score: number;
}

interface Complaint extends Models.Document {
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    department?: string;
    $createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    reviewed: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    resolved: "bg-emerald-100 text-emerald-700",
    escalated: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Submitted",
    reviewed: "Under Review",
    in_progress: "In Progress",
    resolved: "Resolved",
    escalated: "Escalated",
};

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

function getTrustLevel(score: number): { label: string; color: string; icon: any } {
    if (score >= 80) return { label: "Highly Trusted", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: Award };
    if (score >= 60) return { label: "Trusted Citizen", color: "text-blue-600 bg-blue-50 border-blue-200", icon: ShieldCheck };
    if (score >= 40) return { label: "Active Citizen", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Activity };
    return { label: "New Citizen", color: "text-slate-600 bg-slate-50 border-slate-200", icon: User };
}

export default function CitizenProfile() {
    const router = useRouter();
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function init() {
            try {
                const session = await account.get();
                if (isMounted) setUser(session);

                try {
                    const profileRes = await databases.listDocuments(
                        appwriteConfig.databaseId,
                        appwriteConfig.profilesCollectionId,
                        [Query.equal("user_id", session.$id), Query.limit(1)]
                    );
                    if (isMounted && profileRes.documents.length > 0) {
                        setProfile(profileRes.documents[0] as unknown as Profile);
                    }
                } catch (e) {
                    console.log("No profile found");
                }

                try {
                    const complaintsRes = await databases.listDocuments(
                        appwriteConfig.databaseId,
                        appwriteConfig.complaintsCollectionId,
                        [
                            Query.equal("citizen_contact", session.$id),
                            Query.orderDesc("$createdAt"),
                            Query.limit(100)
                        ]
                    );
                    if (isMounted) setComplaints(complaintsRes.documents as unknown as Complaint[]);
                } catch (e) {
                    console.log("Error fetching complaints");
                }
            } catch (err) {
                console.error(err);
                if (isMounted) router.push('/login');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        init();
        return () => { isMounted = false; };
    }, [router]);

    const copyUserId = () => {
        if (user?.$id) {
            navigator.clipboard.writeText(user.$id);
            setCopied(true);
            toast.success("User ID copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
                <ShieldAlert className="w-10 h-10 text-blue-600" />
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500 font-medium">Loading your profile...</p>
            </div>
        );
    }

    if (!user) return null;

    const trustScore = profile?.trust_score ?? 50;
    const trustLevel = getTrustLevel(trustScore);
    const TrustIcon = trustLevel.icon;

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const escalated = complaints.filter(c => c.status === 'escalated').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const recentComplaints = complaints.slice(0, 5);

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    complaints.forEach(c => {
        categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const accountAge = Math.floor((Date.now() - new Date(user.$createdAt).getTime()) / (1000 * 60 * 60 * 24));

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
                {/* Profile Header Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 rounded-sm p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-5">
                        <ShieldCheck className="w-48 h-48 -mt-8 -mr-8" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20 shrink-0">
                            <User className="w-10 h-10 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold tracking-tight">{user.name || "Citizen"}</h1>
                            <p className="text-blue-200 mt-1 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {user.email}
                            </p>
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                {user.emailVerification ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/30">
                                        <BadgeCheck className="w-3.5 h-3.5 mr-1" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30">
                                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Unverified
                                    </Badge>
                                )}
                                <Badge className={`border ${trustLevel.color}`}>
                                    <TrustIcon className="w-3.5 h-3.5 mr-1" /> {trustLevel.label}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-center shrink-0">
                            <div className="text-5xl font-extrabold">{trustScore}</div>
                            <div className="text-blue-200 text-sm font-medium mt-1">Trust Score</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Account Details */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-slate-400" /> Account Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">User ID</span>
                                    <button
                                        onClick={copyUserId}
                                        className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors"
                                    >
                                        {user.$id.substring(0, 12)}...
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Member Since</span>
                                    <span className="text-sm font-medium text-slate-700">
                                        {new Date(user.$createdAt).toLocaleDateString('en-IN', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account Age</span>
                                    <span className="text-sm font-medium text-slate-700">
                                        {accountAge} {accountAge === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</span>
                                    <span className="text-sm font-medium text-slate-700">{user.emailVerification ? 'Verified' : 'Unverified'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category Breakdown */}
                        {topCategories.length > 0 && (
                            <Card className="rounded-sm border-slate-200 shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-slate-400" /> Report Categories
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {topCategories.map(([category, count]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-700 capitalize">{category}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${(count / total) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-mono text-slate-500 w-6 text-right">{count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Privacy & Security */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-slate-400" /> Privacy & Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3 text-sm text-slate-600">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Your identity is confidential on public tracking pages.</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-slate-600">
                                    <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <span>All submissions are official municipal records stored securely.</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-slate-600">
                                    <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                    <span>Only assigned municipal staff can view reporter details.</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white border border-slate-200 rounded-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Total</span>
                                    <FileText className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="text-2xl font-extrabold text-slate-900">{total}</div>
                                <p className="text-xs text-slate-400 mt-0.5">Reports filed</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Resolved</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="text-2xl font-extrabold text-emerald-700">{resolved}</div>
                                <p className="text-xs text-slate-400 mt-0.5">{resolutionRate}% rate</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Active</span>
                                    <Activity className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="text-2xl font-extrabold text-blue-700">{pending + inProgress}</div>
                                <p className="text-xs text-slate-400 mt-0.5">In pipeline</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Escalated</span>
                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                </div>
                                <div className="text-2xl font-extrabold text-rose-600">{escalated}</div>
                                <p className="text-xs text-slate-400 mt-0.5">Needs attention</p>
                            </div>
                        </div>

                        {/* Trust Score Explanation */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <TrustIcon className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-slate-900">Credibility Rating: {trustScore}/100</h3>
                                </div>
                                {/* Trust bar */}
                                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                                        style={{ width: `${trustScore}%` }}
                                    />
                                    <div
                                        className="absolute top-0 h-full w-0.5 bg-white/80"
                                        style={{ left: `${trustScore}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mb-4">
                                    <span>0</span>
                                    <span>25</span>
                                    <span>50</span>
                                    <span>75</span>
                                    <span>100</span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Your trust score increases when your reports are verified and resolved by municipal officials.
                                    Higher scores may unlock priority processing and direct escalation capabilities.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" /> Recent Activity
                                </CardTitle>
                                {total > 5 && (
                                    <Link href="/dashboard" className="text-xs text-blue-600 hover:underline font-medium">
                                        View all →
                                    </Link>
                                )}
                            </CardHeader>
                            <CardContent>
                                {recentComplaints.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500">No reports filed yet.</p>
                                        <Link href="/report">
                                            <Button variant="outline" size="sm" className="mt-3 rounded-sm">
                                                Submit Your First Report
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {recentComplaints.map((complaint) => (
                                            <Link
                                                key={complaint.$id}
                                                href={`/track/${complaint.tracking_id}`}
                                                className="block py-3 hover:bg-slate-50 -mx-3 px-3 rounded transition-colors group"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono text-xs font-bold text-slate-900">
                                                                {complaint.tracking_id}
                                                            </span>
                                                            <span className="text-xs text-slate-400 capitalize">
                                                                {complaint.category}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 line-clamp-1">
                                                            {complaint.description}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                <span className="truncate max-w-[180px]">{complaint.address || "Mapped"}</span>
                                                            </span>
                                                            <span>{formatTimeAgo(complaint.$createdAt)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge variant="secondary" className={`text-xs rounded-sm ${STATUS_COLORS[complaint.status] || STATUS_COLORS.pending}`}>
                                                            {STATUS_LABELS[complaint.status] || complaint.status}
                                                        </Badge>
                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notifications Preferences */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-slate-400" /> Notification Preferences
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-slate-400" /> Email Alerts
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">Get notified when your report status changes.</div>
                                    </div>
                                    <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-not-allowed opacity-80">
                                        <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-0.5 top-[3px]"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-slate-400" /> Resolution Updates
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">Receive alerts when issues in your area are resolved.</div>
                                    </div>
                                    <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-not-allowed opacity-80">
                                        <div className="w-3.5 h-3.5 bg-white rounded-full absolute left-0.5 top-[3px]"></div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-sm border border-slate-100">
                                    Notification preferences are managed by the municipal notification service.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
