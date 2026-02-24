"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    ArrowLeft, MapPin, Clock, User, Phone, Camera,
    CheckCircle2, MessageSquare, UploadCloud, Loader2,
    SearchX, Building2, AlertTriangle, CheckCircle, UserCheck,
    Hash, Zap, ThumbsUp, Calendar, ChevronRight, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { databases, storage, appwriteConfig, account } from "@/lib/appwrite";
import { Query, ID, Models } from "appwrite";
import { toast } from "sonner";
import { getSLAStatus } from "@/lib/slas";

const MiniMap = dynamic(() => import("@/components/MiniMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center animate-pulse text-sm text-slate-400">Loading map...</div>
});

interface Complaint {
    $id: string;
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    citizen_contact: string;
    image_url: string;
    resolution_image_url: string;
    status: string;
    department: string;
    $createdAt: string;
    ai_priority_score?: number;
    ai_analysis?: string;
    upvotes?: number;
    assigned_to?: string;
    lat?: number;
    lng?: number;
}

interface StatusLog {
    $id: string;
    complaint_id: string;
    status_from: string;
    status_to: string;
    remarks: string;
    changed_by_staff_id: string;
    $createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100 text-amber-800", icon: Clock },
    reviewed: { label: "Reviewed", color: "text-sky-700", bg: "bg-sky-100 text-sky-800", icon: Eye },
    in_progress: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100 text-blue-800", icon: Zap },
    resolved: { label: "Resolved", color: "text-emerald-700", bg: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    escalated: { label: "Escalated", color: "text-rose-700", bg: "bg-rose-100 text-rose-800 border border-rose-200", icon: AlertTriangle },
};

export default function ComplaintDetailView({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const complaintTrackingId = unwrappedParams.id;

    const router = useRouter();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [logs, setLogs] = useState<StatusLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [reporterVerified, setReporterVerified] = useState(false);

    const [newStatus, setNewStatus] = useState("");
    const [internalNotes, setInternalNotes] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!complaintTrackingId) return;
            try {
                const userRes = await account.get().catch(() => null);
                setUser(userRes);

                const compRes = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [Query.equal("tracking_id", complaintTrackingId), Query.limit(1)]
                );

                if (compRes.documents.length === 0) {
                    setLoading(false);
                    return;
                }

                const data = compRes.documents[0] as unknown as Complaint;
                setComplaint(data);
                setNewStatus(data.status);

                if (data.citizen_contact && data.citizen_contact !== "anonymous") {
                    try {
                        const profRes = await databases.listDocuments(
                            appwriteConfig.databaseId,
                            appwriteConfig.profilesCollectionId,
                            [Query.equal("user_id", data.citizen_contact), Query.limit(1)]
                        );
                        if (profRes.documents.length > 0) {
                            setReporterVerified((profRes.documents[0] as any).is_verified === true);
                        }
                    } catch (e) {
                        // silently ignore missing profiles
                    }
                }

                const logsRes = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.statusLogsCollectionId,
                    [
                        Query.equal("complaint_id", complaintTrackingId),
                        Query.orderAsc("$createdAt")
                    ]
                );
                setLogs(logsRes.documents as unknown as StatusLog[]);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [complaintTrackingId]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveChanges = async () => {
        if (!complaint) return;
        setSaving(true);
        try {
            if (newStatus === "resolved" && !complaint.resolution_image_url && !photoFile) {
                toast.error("Photographic proof of resolution is strictly required to close a complaint.", { duration: 5000 });
                setSaving(false);
                return;
            }

            let resImageUrl = complaint.resolution_image_url;

            if (newStatus === "resolved" && photoFile) {
                const uploadedFile = await storage.createFile(
                    appwriteConfig.storageId,
                    ID.unique(),
                    photoFile
                );
                resImageUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;
            }

            const response = await fetch('/api/staff/complaint_status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    complaintId: complaint.$id,
                    trackingId: complaint.tracking_id,
                    newStatus: newStatus,
                    oldStatus: complaint.status,
                    internalNotes: internalNotes.trim(),
                    resolutionImageUrl: resImageUrl,
                    changedByStaffId: user ? (user.name || user.email) : "system_admin"
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update status");
            }

            toast.success("Status updated successfully.");
            window.location.reload();
        } catch (error: any) {
            console.error("Failed to save changes:", error);
            toast.error(error.message || "Failed to save changes. Please try again.");
            setSaving(false);
        }
    };

    const handleEscalate = () => {
        if (!complaint || complaint.status === 'escalated') return;
        setNewStatus("escalated");
    };

    const handleAssign = async () => {
        if (!complaint || !user) return;
        setAssigning(true);
        try {
            const isCurrentlyAssignedToMe = complaint.assigned_to === user.$id;
            const targetAssignee = isCurrentlyAssignedToMe ? "" : user.$id;

            const res = await fetch('/api/staff/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    complaintId: complaint.$id,
                    assignedTo: targetAssignee
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update assignment");
            }

            toast.success(isCurrentlyAssignedToMe ? "Unassigned successfully." : "Assigned to you successfully.");
            setComplaint(prev => prev ? { ...prev, assigned_to: targetAssignee } : prev);
        } catch (error: any) {
            console.error("Assignment error:", error);
            toast.error(error.message || "Failed to update assignment.");
        } finally {
            setAssigning(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return "Just now";
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 max-w-5xl mx-auto">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading complaint details...</p>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="flex flex-col items-center justify-center py-20 max-w-5xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <SearchX className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Complaint Not Found</h2>
                <p className="text-slate-500 mb-6 text-center max-w-md">
                    There is no complaint matching ID #{complaintTrackingId}. It may have been deleted or the ID is incorrect.
                </p>
                <Button onClick={() => router.push('/staff/complaints')} variant="outline">Back to Complaints</Button>
            </div>
        );
    }

    const sla = getSLAStatus(complaint.$createdAt, complaint.category, complaint.status);
    const currentConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
    const CurrentStatusIcon = currentConfig.icon;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">

            {/* Top Navigation & Actions */}
            <div className="flex items-center justify-between">
                <Link
                    href="/staff/complaints"
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to List
                </Link>
                <div className="flex gap-3">
                    <Button
                        variant={complaint.assigned_to === user?.$id ? "secondary" : "outline"}
                        onClick={handleAssign}
                        disabled={assigning || !user || (complaint.assigned_to ? complaint.assigned_to !== user.$id : false)}
                        className="gap-2"
                    >
                        {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        {complaint.assigned_to === user?.$id ? "Assigned to Me" : (complaint.assigned_to ? "Assigned" : "Assign to Me")}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleEscalate}
                        disabled={saving || complaint.status === 'escalated'}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                    >
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> Escalate
                    </Button>
                    <Button onClick={handleSaveChanges} disabled={saving} className="bg-blue-700 hover:bg-blue-800 min-w-[140px]">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Status Banner */}
            <div className={`rounded-sm p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${currentConfig.bg}`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-sm bg-white/80 flex items-center justify-center">
                        <CurrentStatusIcon className={`w-6 h-6 ${currentConfig.color}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-slate-900">#{complaint.tracking_id}</h1>
                            <Badge variant="secondary" className={`font-semibold ${currentConfig.bg}`}>
                                {currentConfig.label}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-600 capitalize font-medium">{complaint.category} — {complaint.department || "Unassigned"}</p>
                    </div>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Filed</div>
                    <div className="text-sm font-semibold text-slate-800">{formatDate(complaint.$createdAt)}</div>
                    <div className="text-xs text-slate-500">{formatTimeAgo(complaint.$createdAt)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Details & Action */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Core Info */}
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardContent className="pt-6 space-y-6">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>
                                    <p className="text-sm font-medium text-slate-900 truncate pr-2" title={complaint.address || "No address"}>{complaint.address || "No address"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Building2 className="w-3 h-3" /> Department</span>
                                    <p className="text-sm font-medium text-slate-900">{complaint.department || "Unassigned"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3" /> Reporter</span>
                                    <div className="flex items-center gap-1">
                                        <p className="text-sm font-medium text-slate-900 truncate pr-2 max-w-[150px]" title={complaint.citizen_contact || "Anonymous"}>{complaint.citizen_contact || "Anonymous"}</p>
                                        {reporterVerified && <UserCheck className="w-4 h-4 text-emerald-600" title="Verified Identity" />}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Upvotes</span>
                                    <p className="text-sm font-bold text-blue-600">{complaint.upvotes || 0}</p>
                                </div>
                            </div>

                            {/* Geographical Location */}
                            {complaint.lat && complaint.lng && (
                                <div className="space-y-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Geographical Location
                                    </span>
                                    <div className="h-[200px] w-full rounded-sm overflow-hidden border border-slate-300 shadow-inner relative">
                                        <MiniMap lat={complaint.lat} lng={complaint.lng} />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-50 inline-block px-2 py-1 rounded border border-slate-200">
                                        Coordinates: {complaint.lat.toFixed(6)}, {complaint.lng.toFixed(6)}
                                    </p>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2 pt-4 border-t border-slate-100">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citizen Description</span>
                                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-sm border border-slate-100 whitespace-pre-wrap">
                                    {complaint.description || "No description provided."}
                                </p>
                            </div>

                            {/* Photo Evidence */}
                            {complaint.image_url && (
                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5" /> Submitted Evidence
                                    </span>
                                    <div className="h-48 rounded-sm outline outline-1 outline-slate-200 overflow-hidden bg-slate-100 relative group cursor-pointer w-full sm:w-1/2">
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10"></div>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={complaint.image_url} alt="Complaint evidence" className="absolute inset-0 w-full h-full object-cover" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Area */}
                    <Card className="rounded-sm border-slate-200 shadow-none border-t-4 border-t-blue-700">
                        <CardHeader>
                            <CardTitle className="text-lg">Update Status & Resolution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Change Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {["pending", "in_progress", "resolved"].map(s => {
                                        const cfg = STATUS_CONFIG[s];
                                        const isSelected = newStatus === s;
                                        return (
                                            <Button
                                                key={s}
                                                variant="outline"
                                                className={isSelected ? `ring-2 ring-offset-1 ${cfg.bg}` : ""}
                                                onClick={() => setNewStatus(s)}
                                            >
                                                {cfg.label}
                                            </Button>
                                        );
                                    })}
                                    {complaint.status === "escalated" && (
                                        <Button variant="outline" disabled className="opacity-50 line-through">Escalated</Button>
                                    )}
                                </div>
                            </div>

                            {newStatus === "resolved" && !complaint.resolution_image_url && (
                                <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-sm animate-in slide-in-from-top-2">
                                    <label className="text-sm font-medium text-slate-700">Resolution Proof (Required)</label>
                                    <label className={`flex items-center justify-center w-full h-32 border-2 border-dashed ${photoPreview ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'} rounded-sm cursor-pointer transition-colors overflow-hidden relative`}>
                                        {photoPreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                                                <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                                                <p className="text-sm font-medium">Upload photo of fixed issue</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                    </label>
                                </div>
                            )}

                            {complaint.resolution_image_url && (
                                <div className="space-y-2 p-4 bg-emerald-50 border border-emerald-200 rounded-sm">
                                    <label className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Resolution Proof Attached
                                    </label>
                                    <div className="h-32 rounded-sm outline outline-1 outline-emerald-200 overflow-hidden bg-slate-100 relative w-1/2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={complaint.resolution_image_url} alt="Resolution proof" className="absolute inset-0 w-full h-full object-cover" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Internal Staff Notes
                                </label>
                                <Textarea
                                    placeholder="Notes added here will be logged in the timeline and only visible to staff..."
                                    className="min-h-[100px]"
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-6">

                    {/* AI Insights */}
                    {complaint.ai_priority_score !== undefined && (
                        <Card className="rounded-sm border-blue-100 shadow-none border-t-4 border-t-blue-700 bg-blue-50/50">
                            <CardHeader className="pb-3 border-b border-blue-100/50">
                                <CardTitle className="text-base flex items-center justify-between text-blue-900">
                                    <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> AI Triage</span>
                                    <Badge variant="outline" className={`font-medium border 
                                        ${complaint.ai_priority_score >= 80 ? 'bg-rose-100 text-rose-700 border-rose-200' : ''}
                                        ${complaint.ai_priority_score >= 40 && complaint.ai_priority_score < 80 ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                                        ${complaint.ai_priority_score < 40 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                                    `}>
                                        {complaint.ai_priority_score}/100
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-sm text-slate-700 leading-relaxed italic bg-white p-3 rounded-sm border border-blue-200">
                                    &quot;{complaint.ai_analysis || 'No detailed analysis provided.'}&quot;
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* SLA Status */}
                    <Card className={`rounded-sm shadow-none border-t-4 ${sla.status === 'breached' ? 'border-t-rose-600 border-rose-200 bg-rose-50/30' : sla.status === 'warning' ? 'border-t-amber-500 border-amber-200 bg-amber-50/30' : 'border-t-emerald-500 border-emerald-200 bg-emerald-50/30'}`}>
                        <CardHeader className="pb-3 border-b border-slate-100/50">
                            <CardTitle className="text-base flex items-center justify-between">
                                SLA Status
                                {sla.status === 'breached' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Breached</Badge>}
                                {sla.status === 'warning' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Warning</Badge>}
                                {sla.status === 'good' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">On Track</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${sla.status === 'breached' ? 'bg-rose-100 text-rose-600' : sla.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {sla.status === 'breached' ? <AlertTriangle className="w-5 h-5" /> : sla.status === 'warning' ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    {complaint.status === 'resolved' ? (
                                        <>
                                            <p className="text-sm font-medium text-slate-900">SLA Met & Resolved</p>
                                            <p className="text-xs text-slate-500">Complaint closed within threshold.</p>
                                        </>
                                    ) : (
                                        <>
                                            {sla.status === 'breached' ? (
                                                <p className="text-sm font-bold text-rose-700">{Math.ceil(sla.hoursOverdue)}h Overdue (Limit: {sla.totalSLAHours}h)</p>
                                            ) : (
                                                <p className="text-sm font-bold text-slate-900">{Math.ceil(sla.hoursRemaining)}h Remaining (Total: {sla.totalSLAHours}h)</p>
                                            )}
                                            <p className="text-xs text-slate-500">Target Resolution Timeframe</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reporter Info */}
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base">Reporter Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{complaint.citizen_contact || 'Anonymous Citizen'}</p>
                                    <p className="text-xs text-slate-500">Provided Contact</p>
                                </div>
                            </div>
                            {complaint.citizen_contact && (
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 break-all">
                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" /> {complaint.citizen_contact}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Audit Timeline */}
                    <Card className="rounded-sm border-slate-200 shadow-none">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base flex items-center justify-between">
                                Audit Timeline
                                <Badge variant="outline" className="text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50">
                                    Immutable
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="relative">
                                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-100" />
                                <div className="space-y-4">
                                    {/* Initial submission */}
                                    <div className="flex gap-4 relative z-10">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-slate-100 border border-slate-200">
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0 opacity-70">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-slate-900">Complaint Submitted</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{formatDate(complaint.$createdAt)} at {formatTime(complaint.$createdAt)}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">— by System</p>
                                        </div>
                                    </div>

                                    {/* Log entries */}
                                    {logs.map((log) => {
                                        const toConfig = STATUS_CONFIG[log.status_to] || STATUS_CONFIG.pending;
                                        const ToIcon = toConfig.icon;
                                        return (
                                            <div key={log.$id} className="flex gap-4 relative z-10">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toConfig.bg} border`}>
                                                    <ToIcon className="w-3 h-3" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-semibold text-slate-900">{toConfig.label}</span>
                                                        <span className="text-xs text-slate-400">{formatDate(log.$createdAt)} at {formatTime(log.$createdAt)}</span>
                                                    </div>
                                                    {log.remarks && (
                                                        <div className="mt-1.5 p-2.5 bg-slate-50 rounded-sm border border-slate-100 text-sm text-slate-600 italic">
                                                            &quot;{log.remarks}&quot;
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-slate-400 mt-1">— by {log.changed_by_staff_id}</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {logs.length === 0 && (
                                        <div className="text-center py-4 text-sm text-slate-400">
                                            No status updates yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
