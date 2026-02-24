"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, MapPin, AlertCircle, Loader2, CalendarDays,
    Image as ImageIcon, CheckCircle2, Clock, Activity, Eye,
    AlertTriangle, ShieldAlert, Hash, Building2, Zap,
    ChevronRight, Copy, Share2, Flag, Star
} from "lucide-react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { databases, appwriteConfig } from "@/lib/appwrite";

const MiniMap = dynamic(() => import("@/components/MiniMap"), { ssr: false });
import { Query, Models } from "appwrite";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any; description: string }> = {
    pending: {
        label: "Submitted",
        color: "text-slate-600",
        bgColor: "bg-slate-100 text-slate-600 border-slate-200",
        icon: Clock,
        description: "Your report has been officially recorded in the municipal system and is awaiting initial triage."
    },
    reviewed: {
        label: "Under Review",
        color: "text-amber-600",
        bgColor: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Eye,
        description: "A civic official is currently examining the details of your report to assign the appropriate department."
    },
    in_progress: {
        label: "In Progress",
        color: "text-blue-600",
        bgColor: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Activity,
        description: "The assigned department has dispatched personnel or initiated actions to resolve the reported issue."
    },
    resolved: {
        label: "Resolved",
        color: "text-emerald-600",
        bgColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
        description: "The issue has been officially addressed and verified as resolved by the respective authority."
    },
    escalated: {
        label: "Escalated",
        color: "text-rose-600",
        bgColor: "bg-rose-100 text-rose-700 border-rose-200",
        icon: AlertTriangle,
        description: "This report requires higher-level intervention and has been escalated to senior management."
    },
};

const STATUS_ORDER = ["pending", "reviewed", "in_progress", "resolved"];

interface Complaint extends Models.Document {
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    image_url: string | null;
    department?: string;
    ai_priority_score?: number;
    ai_analysis?: string;
    upvotes?: number;
    lat?: number;
    lng?: number;
    $createdAt: string;
    logs: StatusLog[];
    citizen_feedback_rating?: number;
    citizen_feedback_text?: string;
}

interface StatusLog extends Models.Document {
    complaint_id: string;
    status_from: string;
    status_to: string;
    remarks: string;
    changed_by_staff_id: string;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return "Just now";
}

export default function TrackDetail({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const trackingId = unwrappedParams.id;

    const [data, setData] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [feedbackText, setFeedbackText] = useState("");
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        async function fetchComplaint() {
            try {
                const complaintRes = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [Query.equal("tracking_id", trackingId), Query.limit(1)]
                );


                if (complaintRes.documents.length === 0) {
                    setError("Complaint not found. Please check the tracking ID.");
                    setLoading(false);
                    return;
                }

                const entry = complaintRes.documents[0];

                const logsRes = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.statusLogsCollectionId,
                    [
                        Query.equal("complaint_id", trackingId),
                        Query.orderAsc("$createdAt")
                    ]
                );

                setData({
                    ...(entry as unknown as Complaint),
                    logs: logsRes.documents as unknown as StatusLog[]
                });
            } catch (err) {
                console.error("Error fetching data", err);
                setError("Failed to fetch complaint details.");
            } finally {
                setLoading(false);
            }
        }

        fetchComplaint();
    }, [trackingId]);

    const copyTrackingId = () => {
        navigator.clipboard.writeText(trackingId);
        setCopied(true);
        toast.success("Tracking ID copied");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareComplaint = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: `Complaint ${trackingId}`, url });
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
        }
    };

    const handleFeedbackSubmit = async () => {
        if (!rating) {
            toast.error("Please provide a star rating.");
            return;
        }
        setSubmittingFeedback(true);
        try {
            const res = await fetch("/api/citizen/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    complaintId: data?.$id,
                    trackingId: data?.tracking_id,
                    rating,
                    feedbackText
                })
            });

            if (!res.ok) throw new Error("Failed to submit feedback");

            toast.success("Thank you for your feedback!");
            if (data) {
                setData({ ...data, citizen_feedback_rating: rating, citizen_feedback_text: feedbackText });
            }
        } catch (error) {
            toast.error("An error occurred while submitting your feedback.");
            console.error(error);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleWithdraw = async () => {
        if (!confirm("Are you sure you want to withdraw this complaint? This cannot be undone.")) return;

        setWithdrawing(true);
        try {
            const res = await fetch("/api/citizen/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    complaintId: data?.$id,
                    trackingId: trackingId
                })
            });

            if (!res.ok) throw new Error("Failed to withdraw complaint");

            toast.success("Complaint withdrawn successfully.");

            // Optimistically update the local state without full reload
            if (data) {
                const newLogs = [...data.logs, {
                    $id: Date.now().toString(),
                    complaint_id: trackingId,
                    status_from: 'pending',
                    status_to: 'resolved',
                    remarks: 'Complaint withdrawn by citizen.',
                    changed_by_staff_id: 'citizen',
                    $createdAt: new Date().toISOString()
                } as unknown as StatusLog];

                setData({ ...data, status: 'resolved', logs: newLogs });
            }
        } catch (error) {
            toast.error("An error occurred while withdrawing.");
            console.error(error);
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
                <ShieldAlert className="w-10 h-10 text-blue-600" />
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500 font-medium">Loading complaint details...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="bg-white p-8 rounded-sm border border-slate-200 text-center max-w-sm space-y-4">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                    <h2 className="text-xl font-bold text-slate-900">Not Found</h2>
                    <p className="text-slate-600">{error || "Could not find this issue."}</p>
                    <Link href="/track">
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm mt-2">
                            Go Back
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const currentStatusIndex = STATUS_ORDER.indexOf(data.status);
    const currentConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.pending;
    const CurrentStatusIcon = currentConfig.icon;
    const isEscalated = data.status === 'escalated';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Bar */}
            <header className="px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/track" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium gap-1.5">
                        <ArrowLeft className="w-4 h-4" /> Back to Tracking
                    </Link>
                    <div className="flex items-center gap-2">
                        {data.status === 'pending' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleWithdraw}
                                disabled={withdrawing}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 mr-2"
                            >
                                {withdrawing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                                Withdraw
                            </Button>
                        )}
                        <button
                            onClick={copyTrackingId}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-mono font-bold text-slate-900 bg-slate-100 rounded-sm hover:bg-slate-200 transition-colors border border-slate-200"
                        >
                            <Hash className="w-3.5 h-3.5 text-slate-400" />
                            {trackingId}
                            <Copy className="w-3 h-3 text-slate-400" />
                        </button>
                        <button
                            onClick={shareComplaint}
                            className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-sm hover:bg-slate-100"
                            title="Share this complaint"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Status Banner */}
                <div className={`rounded-sm p-6 border ${isEscalated ? 'bg-rose-50 border-rose-200' : currentConfig.bgColor} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${isEscalated ? 'bg-rose-100' : 'bg-white/80'}`}>
                            <CurrentStatusIcon className={`w-6 h-6 ${currentConfig.color}`} />
                        </div>
                        <div>
                            <div className={`font-bold text-lg ${currentConfig.color}`}>{currentConfig.label}</div>
                            <p className="text-sm text-slate-600 max-w-md">{currentConfig.description}</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Reported</div>
                        <div className="text-sm font-semibold text-slate-700">{formatDate(data.$createdAt)}</div>
                        <div className="text-xs text-slate-400">{formatTimeAgo(data.$createdAt)}</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Complaint Description */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <CardTitle className="text-base font-bold text-slate-900">Complaint Description</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.description}</p>
                                <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-slate-100">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 rounded-sm capitalize">
                                        <Flag className="w-3 h-3 mr-1" /> {data.category}
                                    </Badge>
                                    {data.department && (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 rounded-sm">
                                            <Building2 className="w-3 h-3 mr-1" /> {data.department}
                                        </Badge>
                                    )}
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-sm">
                                        <CalendarDays className="w-3 h-3 mr-1" /> {formatDate(data.$createdAt)}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Resolution Timeline */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <CardTitle className="text-base font-bold text-slate-900">Resolution Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5">
                                {/* Progress Steps */}
                                <div className="flex items-center justify-between mb-8">
                                    {STATUS_ORDER.map((s, index) => {
                                        const isCompleted = index <= currentStatusIndex;
                                        const isCurrent = index === currentStatusIndex;
                                        const config = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
                                        const StepIcon = config.icon;

                                        return (
                                            <div key={s} className="flex items-center flex-1 last:flex-initial">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isCurrent
                                                        ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                                                        : isCompleted
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-white border-slate-200 text-slate-300'
                                                        }`}>
                                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                                                    </div>
                                                    <span className={`text-xs font-medium mt-2 ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                {index < STATUS_ORDER.length - 1 && (
                                                    <div className={`flex-1 h-0.5 mx-2 ${index < currentStatusIndex ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Log Entries */}
                                {data.logs.filter(log => log.status_from !== log.status_to || log.changed_by_staff_id === 'citizen').length > 0 && (
                                    <div className="border-t border-slate-100 pt-5">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-4">Activity Log</h4>
                                        <div className="relative">
                                            <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-100" />
                                            <div className="space-y-4">
                                                {data.logs.filter(log => log.status_from !== log.status_to || log.changed_by_staff_id === 'citizen').map((log) => {
                                                    const toConfig = STATUS_CONFIG[log.status_to] || STATUS_CONFIG.pending;
                                                    const ToIcon = toConfig.icon;
                                                    return (
                                                        <div key={log.$id} className="flex gap-4 relative z-10">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toConfig.bgColor} border`}>
                                                                <ToIcon className="w-3 h-3" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-sm font-semibold text-slate-900">
                                                                        Status changed to {toConfig.label}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">
                                                                        {formatDateTime(log.$createdAt)}
                                                                    </span>
                                                                </div>
                                                                {log.remarks && log.changed_by_staff_id === 'citizen' && (
                                                                    <div className="mt-1.5 p-2.5 bg-slate-50 rounded-sm border border-slate-100 text-sm text-slate-600">
                                                                        {log.remarks}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {data.logs.filter(log => log.status_from !== log.status_to || log.changed_by_staff_id === 'citizen').length === 0 && (
                                    <div className="text-center py-6 text-sm text-slate-400">
                                        No status updates yet. The complaint is awaiting initial triage.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Feedback Section (Only shown if resolved) */}
                        {data.status === 'resolved' && (
                            <Card className="rounded-sm border-emerald-200 shadow-none bg-emerald-50/50">
                                <CardHeader className="pb-3 border-b border-emerald-100">
                                    <CardTitle className="text-base font-bold text-emerald-900">Provide Feedback</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-4">
                                    {data.citizen_feedback_rating ? (
                                        <div className="space-y-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} className={`w-5 h-5 ${star <= data.citizen_feedback_rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                                ))}
                                            </div>
                                            {data.citizen_feedback_text && (
                                                <p className="text-sm text-slate-700 italic border-l-2 border-emerald-300 pl-3">
                                                    "{data.citizen_feedback_text}"
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-600">How satisfied are you with the resolution of this complaint?</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setRating(star)}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        className="focus:outline-none transition-transform hover:scale-110"
                                                    >
                                                        <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                className="w-full text-sm p-3 rounded-sm border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                                                placeholder="Any additional remarks? (Optional)"
                                                value={feedbackText}
                                                onChange={(e) => setFeedbackText(e.target.value)}
                                            />
                                            <Button
                                                onClick={handleFeedbackSubmit}
                                                disabled={submittingFeedback || rating === 0}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm w-full sm:w-auto"
                                            >
                                                {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                Submit Feedback
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Complaint Metadata */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-700">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Category</span>
                                    <span className="text-sm font-medium text-slate-700 capitalize">{data.category}</span>
                                </div>
                                {data.department && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Department</span>
                                        <span className="text-sm font-medium text-slate-700">{data.department}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
                                    <Badge variant="secondary" className={`text-xs rounded-sm ${currentConfig.bgColor}`}>
                                        {currentConfig.label}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Filed On</span>
                                    <span className="text-sm font-medium text-slate-700">{formatDate(data.$createdAt)}</span>
                                </div>
                                {data.upvotes !== undefined && data.upvotes > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Upvotes</span>
                                        <span className="text-sm font-bold text-blue-600">👍 {data.upvotes}</span>
                                    </div>
                                )}
                                {data.ai_priority_score !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Priority</span>
                                        <Badge variant="secondary" className={`text-xs rounded-sm ${data.ai_priority_score >= 80 ? 'bg-rose-100 text-rose-700' :
                                            data.ai_priority_score >= 40 ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            <Zap className="w-3 h-3 mr-1" /> {data.ai_priority_score}/100
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* AI Analysis */}
                        {data.ai_analysis && (
                            <Card className="rounded-sm border-blue-100 bg-blue-50/50 shadow-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> AI Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-blue-900/80 leading-relaxed">{data.ai_analysis}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Location */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500" /> Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 mb-3">{data.address || "No address provided"}</p>
                                {data.address && (
                                    <div className="h-48 w-full bg-slate-100 rounded-sm overflow-hidden relative border border-slate-200">
                                        {data.lat && data.lng ? (
                                            <MiniMap lat={data.lat} lng={data.lng} />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/13/2361/3188.png')] opacity-60 bg-cover bg-center" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-md animate-pulse" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Evidence */}
                        <Card className="rounded-sm border-slate-200 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-blue-500" /> Evidence
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.image_url ? (
                                    <div className="aspect-video bg-slate-100 rounded-sm border border-slate-200 overflow-hidden relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={data.image_url} alt="Evidence photo" className="absolute inset-0 w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-slate-100 rounded-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
                                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-sm">No photo attached</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Help Card */}
                        <div className="bg-slate-900 p-5 rounded-sm text-white">
                            <h3 className="font-bold mb-2 flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4 text-amber-400" /> Need Help?
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                For extreme emergencies, please call <strong className="text-white">112</strong> immediately. For updates on this complaint, bookmark this page.
                            </p>
                            <div className="mt-3 flex gap-2">
                                <Link href="/track">
                                    <Button variant="outline" size="sm" className="rounded-sm border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 text-xs">
                                        Track Another
                                    </Button>
                                </Link>
                                <Link href="/report">
                                    <Button size="sm" className="rounded-sm bg-blue-600 hover:bg-blue-700 text-xs">
                                        New Report
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
