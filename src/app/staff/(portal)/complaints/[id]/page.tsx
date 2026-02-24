"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    MapPin,
    Clock,
    User,
    Phone,
    Camera,
    CheckCircle2,
    MessageSquare,
    UploadCloud,
    Loader2,
    SearchX,
    Building2,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { databases, storage, appwriteConfig, account } from "@/lib/appwrite";
import { Query, ID, Models } from "appwrite";
import { toast } from "sonner";
import { getSLAStatus } from "@/lib/slas";

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

export default function ComplaintDetailView({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [logs, setLogs] = useState<StatusLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [newStatus, setNewStatus] = useState("");
    const [internalNotes, setInternalNotes] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Auth state
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch auth user
                const userRes = await account.get().catch(() => null);
                setUser(userRes);
                // Fetch complaint
                const compRes = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [Query.equal("tracking_id", params.id), Query.limit(1)]
                );

                if (compRes.documents.length === 0) {
                    setLoading(false);
                    return;
                }

                const data = compRes.documents[0] as unknown as Complaint;
                setComplaint(data);
                setNewStatus(data.status);

                // Fetch logs
                const logsRes = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.statusLogsCollectionId,
                    [
                        Query.equal("complaint_id", params.id),
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
    }, [params.id]);

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
            // UI validation for evidence
            if (newStatus === "resolved" && !complaint.resolution_image_url && !photoFile) {
                toast.error("Photographic proof of resolution is strictly required to close a complaint.", {
                    duration: 5000,
                });
                setSaving(false);
                return;
            }

            let resImageUrl = complaint.resolution_image_url;

            // Upload resolution image if moving to resolved and an image is provided
            if (newStatus === "resolved" && photoFile) {
                const uploadedFile = await storage.createFile(
                    appwriteConfig.storageId,
                    ID.unique(),
                    photoFile
                );

                resImageUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;
            }

            // Call Secure Server API
            const response = await fetch('/api/staff/complaint_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
            // Reload page to reflect changes
            window.location.reload();
        } catch (error: any) {
            console.error("Failed to save changes:", error);
            toast.error(error.message || "Failed to save changes. Please try again.");
            setSaving(false);
        }
    };

    const handleEscalate = async () => {
        if (!complaint || complaint.status === 'escalated') return;
        setNewStatus("escalated");
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
            case 'in_progress':
            case 'progress': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'resolved': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
            case 'escalated': return 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-100';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const formatStatus = (status: string) => {
        if (status === 'in_progress') return 'In Progress';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

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
                <p className="text-slate-500 mb-6 text-center max-w-md">There is no complaint matching ID #{params.id}. It may have been deleted or the ID is incorrect.</p>
                <Button onClick={() => router.push('/staff/complaints')} variant="outline">Back to Complaints</Button>
            </div>
        );
    }

    const sla = getSLAStatus(complaint.$createdAt, complaint.category, complaint.status);

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
                        variant="outline"
                        onClick={handleEscalate}
                        disabled={saving || complaint.status === 'escalated'}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                    >
                        Escalate
                    </Button>
                    <Button onClick={handleSaveChanges} disabled={saving} className="bg-blue-700 hover:bg-blue-800 min-w-[140px]">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Complaint Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-sm border-slate-300 shadow-none">
                        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-slate-900">#{complaint.tracking_id}</h1>
                                    <Badge variant="secondary" className={`font-medium ${getStatusStyle(complaint.status)}`}>
                                        {formatStatus(complaint.status)}
                                    </Badge>
                                </div>
                                <CardDescription className="text-base text-slate-700 font-medium capitalize">{complaint.category}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">

                            {/* Core Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</span>
                                    <p className="font-medium text-slate-900">{complaint.address || "No precise address"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Department</span>
                                    <p className="font-medium text-slate-900">{complaint.department || "Unassigned"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Logged At</span>
                                    <p className="font-medium text-slate-900">{formatDate(complaint.$createdAt)}</p>
                                    <p className="text-sm text-slate-500">{formatTime(complaint.$createdAt)} ({formatTimeAgo(complaint.$createdAt)})</p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citizen Description</span>
                                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                    {complaint.description || "No description provided."}
                                </p>
                            </div>

                            {/* Photo Evidence */}
                            {complaint.image_url && (
                                <div className="space-y-3">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5" /> Submitted Evidence
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="h-48 rounded-sm outline outline-1 outline-slate-300 overflow-hidden bg-slate-100 relative group cursor-pointer">
                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10"></div>
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{ backgroundImage: `url(${complaint.image_url})` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    {/* Action Area */}
                    <Card className="rounded-sm border-slate-300 shadow-none border-t-4 border-t-blue-700">
                        <CardHeader>
                            <CardTitle className="text-lg">Update Status & Resolution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium text-slate-700">Change Status</label>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" className={newStatus === "pending" ? "ring-2 ring-slate-900" : ""} onClick={() => setNewStatus("pending")}>Pending</Button>
                                    <Button variant="outline" className={newStatus === "in_progress" ? "ring-2 ring-blue-600 bg-blue-50 text-blue-700 border-blue-200" : ""} onClick={() => setNewStatus("in_progress")}>In Progress</Button>
                                    <Button variant="outline" className={newStatus === "resolved" ? "ring-2 ring-emerald-600 bg-emerald-50 text-emerald-700 border-emerald-200" : ""} onClick={() => setNewStatus("resolved")}>Resolved</Button>
                                    {complaint.status === "escalated" && (
                                        <Button variant="outline" disabled className="opacity-50 line-through">Escalated</Button>
                                    )}
                                </div>
                            </div>

                            {newStatus === "resolved" && !complaint.resolution_image_url && (
                                <div className="space-y-2 p-4 bg-slate-50 border border-slate-300 rounded-sm animate-in slide-in-from-top-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        Resolution Proof (Optional but Recommended)
                                    </label>
                                    <label className={`flex items-center justify-center w-full h-32 border-2 border-dashed ${photoPreview ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'} rounded-sm cursor-pointer transition-colors overflow-hidden relative`}>
                                        {photoPreview ? (
                                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photoPreview})` }}></div>
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
                                <div className="space-y-2 p-4 bg-emerald-50 border border-emerald-300 rounded-sm">
                                    <label className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                                        Resolution Proof Attached
                                    </label>
                                    <div className="h-32 rounded-sm outline outline-1 outline-emerald-300 overflow-hidden bg-slate-100 relative w-1/2">
                                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${complaint.resolution_image_url})` }}></div>
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

                {/* Right Column: Meta & Timeline */}
                <div className="space-y-6">

                    {/* AI Insights (If Available) */}
                    {complaint.ai_priority_score !== undefined && (
                        <Card className="rounded-sm border-blue-300 shadow-none border-t-4 border-t-blue-700 bg-blue-50/50">
                            <CardHeader className="pb-3 border-b border-blue-100/50">
                                <CardTitle className="text-base flex items-center justify-between text-blue-900">
                                    AI Triage Insights
                                    <Badge variant="outline" className={`font-medium border border-blue-200 
                                            ${complaint.ai_priority_score >= 80 ? 'bg-rose-100 text-rose-700' : ''}
                                            ${complaint.ai_priority_score >= 40 && complaint.ai_priority_score < 80 ? 'bg-amber-100 text-amber-700' : ''}
                                            ${complaint.ai_priority_score < 40 ? 'bg-emerald-100 text-emerald-700' : ''}
                                        `}>
                                        Priority: {complaint.ai_priority_score}/100
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div>
                                    <p className="text-sm text-slate-700 leading-relaxed italic bg-white p-3 rounded-sm border border-blue-200 shadow-none">
                                        &quot;{complaint.ai_analysis || 'No detailed analysis provided.'}&quot;
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* SLA Status Widget */}
                    <Card className={`rounded-sm shadow-none border-t-4 ${sla.status === 'breached' ? 'border-t-rose-600 border-rose-300 bg-rose-50/30' : sla.status === 'warning' ? 'border-t-amber-500 border-amber-300 bg-amber-50/30' : 'border-t-emerald-500 border-emerald-300 bg-emerald-50/30'}`}>
                        <CardHeader className="pb-3 border-b border-slate-100/50">
                            <CardTitle className="text-base flex items-center justify-between">
                                Service Level Agreement
                                {sla.status === 'breached' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Breached</Badge>}
                                {sla.status === 'warning' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Warning</Badge>}
                                {sla.status === 'good' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">On Track</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center ${sla.status === 'breached' ? 'bg-rose-100 text-rose-600' : sla.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
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
                    <Card className="rounded-sm border-slate-300 shadow-none">
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
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 break-all">
                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" /> {complaint.citizen_contact}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card className="rounded-sm border-slate-300 shadow-none">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base flex items-center justify-between">
                                Audit Timeline
                                <Badge variant="outline" className="text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50">Immutable Record</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">

                                {logs.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center relative z-10 bg-white py-2">No updates recorded yet.</p>
                                ) : (
                                    logs.map((log, index) => (
                                        <div key={log.$id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                            {/* Icon */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                                {(log.status_to === 'resolved' || index === logs.length - 1) ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                                            </div>

                                            {/* Content */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-sm border border-slate-300 bg-white shadow-none space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-900 text-sm">Status: {formatStatus(log.status_to)}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDate(log.$createdAt)} at {formatTime(log.$createdAt)}</p>
                                                {log.remarks && (
                                                    <p className="text-sm text-slate-700 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic">&quot;{log.remarks}&quot;</p>
                                                )}
                                                <p className="text-xs text-slate-400 mt-1 font-medium">— by Staff {log.changed_by_staff_id}</p>
                                            </div>

                                        </div>
                                    ))
                                )}

                                {/* Initial Submission Log (Synthesized for visual context since we don't always log the CREATE action explicitly in status_logs array depending on implementation) */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-sm border border-slate-300 bg-white shadow-none space-y-1 opacity-75">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-900 text-sm gap-2 flex items-center">Complaint Submitted</span>
                                        </div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDate(complaint.$createdAt)} at {formatTime(complaint.$createdAt)}</p>
                                        <p className="text-xs text-slate-400 mt-1 font-medium">— by System</p>
                                    </div>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
