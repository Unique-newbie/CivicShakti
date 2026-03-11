"use client";

import { useEffect, useState } from "react";
import { getAuthJWT } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertOctagon, Loader2, Trash2, RefreshCw, ChevronDown, ChevronUp,
    AlertTriangle, Info, XCircle, ShieldAlert, Clock
} from "lucide-react";
import { toast } from "sonner";

interface ErrorLog {
    $id: string;
    errorMessage: string;
    $createdAt: string;
}

interface ParsedError {
    message: string;
    error_type?: string;
    stack?: string;
    context?: string;
    url?: string;
    user_id?: string;
    severity?: string;
}

const SEVERITY_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    critical: { label: "CRITICAL", icon: XCircle, color: "text-red-700", bg: "bg-red-100 border-red-200" },
    error: { label: "ERROR", icon: AlertOctagon, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
    warning: { label: "WARNING", icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    info: { label: "INFO", icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
};

const ERROR_TYPE_LABELS: Record<string, string> = {
    api_error: "API Error",
    client_error: "Client Error",
    auth_error: "Auth Error",
    validation_error: "Validation",
    network_error: "Network",
};

/**
 * Parse the errorMessage field. It can be:
 * 1. A JSON string with structured data (new format)
 * 2. A plain text message (old format / legacy)
 */
function parseErrorMessage(raw: string): ParsedError {
    if (!raw) return { message: 'Unknown Error' };
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed.message) {
            return parsed as ParsedError;
        }
        // If JSON but no message key, treat as plain text
        return { message: raw };
    } catch {
        // Not JSON, treat as plain text message
        return { message: raw };
    }
}

export default function ErrorsPage() {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isSystemDown, setIsSystemDown] = useState(false);

    const fetchErrors = async () => {
        setLoading(true);
        setIsSystemDown(false);
        try {
            const token = await getAuthJWT();
            const res = await fetch("/api/errors", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            
            if (!res.ok || data.success === false) {
                setIsSystemDown(true);
                return;
            }
            
            setErrors(data.documents as ErrorLog[]);
        } catch (error) {
            console.error("Failed to fetch error logs:", error);
            setIsSystemDown(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchErrors(); }, []);

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to clear all error logs? This cannot be undone.")) return;
        setClearing(true);
        try {
            const token = await getAuthJWT();
            const res = await fetch("/api/errors", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to clear logs");
            const data = await res.json();
            toast.success(`Cleared ${data.deleted} error logs`);
            setErrors([]);
        } catch (error: any) {
            toast.error(error.message || "Failed to clear logs");
        } finally {
            setClearing(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ago`;
        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return "Just now";
    };

    // Stats
    const totalErrors = errors.length;
    const criticalCount = errors.filter(e => {
        const p = parseErrorMessage(e.errorMessage);
        return p.severity === 'critical';
    }).length;
    const todayCount = errors.filter(e => {
        const d = new Date(e.$createdAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    }).length;

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-sm border-slate-200 shadow-none">
                    <CardContent className="pt-4 pb-4 flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <AlertOctagon className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalErrors}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Errors</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-sm border-slate-200 shadow-none">
                    <CardContent className="pt-4 pb-4 flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{criticalCount}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Critical</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-sm border-slate-200 shadow-none">
                    <CardContent className="pt-4 pb-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{todayCount}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Today</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Error Logs Table */}
            <Card className="rounded-sm border-rose-200 shadow-none">
                <CardHeader className="border-b border-rose-200 bg-rose-50/50 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2 text-rose-950">
                                <AlertOctagon className="w-5 h-5 text-rose-500" />
                                System Error Logs
                            </CardTitle>
                            <p className="text-sm text-slate-500 mt-1">
                                Captured exceptions from API routes and client-side error boundaries.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchErrors}
                                disabled={loading}
                                className="gap-1 text-slate-600 border-slate-300"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            {errors.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAll}
                                    disabled={clearing}
                                    className="gap-1 text-rose-600 border-rose-300 hover:bg-rose-50"
                                >
                                    {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[50px]">Severity</TableHead>
                                    <TableHead className="w-[160px]">Timestamp</TableHead>
                                    <TableHead className="w-[100px]">Type</TableHead>
                                    <TableHead className="max-w-[350px]">Message</TableHead>
                                    <TableHead className="w-[150px]">Source</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isSystemDown ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center bg-rose-50/30">
                                            <div className="flex flex-col items-center gap-2 text-rose-600">
                                                <AlertOctagon className="w-8 h-8 opacity-80" />
                                                <p className="font-medium text-lg">System Unavailable</p>
                                                <p className="text-sm text-rose-500/80 max-w-sm">
                                                    Could not reach the database. The system is currently experiencing a major outage.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : errors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <ShieldAlert className="w-8 h-8" />
                                                <p className="font-medium">No errors found</p>
                                                <p className="text-xs">System is healthy. All clear!</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    errors.map((err) => {
                                        const parsed = parseErrorMessage(err.errorMessage);
                                        const sev = parsed.severity || "error";
                                        const sevConfig = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.error;
                                        const SevIcon = sevConfig.icon;
                                        const isExpanded = expandedId === err.$id;
                                        const errorType = parsed.error_type || 'unknown';

                                        return (
                                            <TableRow
                                                key={err.$id}
                                                className="hover:bg-slate-50 cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : err.$id)}
                                            >
                                                <TableCell>
                                                    <Badge variant="outline" className={`${sevConfig.bg} ${sevConfig.color} font-mono text-[10px] px-1.5 py-0.5`}>
                                                        <SevIcon className="w-3 h-3 mr-0.5" />
                                                        {sevConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-700">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs">{new Date(err.$createdAt).toLocaleString()}</span>
                                                        <span className="text-[10px] text-slate-400">{formatTimeAgo(err.$createdAt)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                        {ERROR_TYPE_LABELS[errorType] || errorType}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-slate-800 line-clamp-2 text-sm" title={parsed.message}>
                                                            {parsed.message}
                                                        </p>
                                                        {isExpanded && parsed.stack && (
                                                            <pre className="mt-2 text-[10px] bg-slate-900 text-green-400 p-3 rounded-md overflow-x-auto max-h-40 whitespace-pre-wrap">
                                                                {parsed.stack}
                                                            </pre>
                                                        )}
                                                        {isExpanded && (
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                                                <ChevronUp className="w-3 h-3" /> Click to collapse
                                                            </div>
                                                        )}
                                                        {!isExpanded && parsed.stack && (
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-500">
                                                                <ChevronDown className="w-3 h-3" /> Click to expand stack trace
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {parsed.url && (
                                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[130px] block" title={parsed.url}>
                                                                {parsed.url}
                                                            </span>
                                                        )}
                                                        {parsed.user_id && (
                                                            <span className="text-[10px] text-slate-400 truncate max-w-[130px] block">
                                                                👤 {parsed.user_id}
                                                            </span>
                                                        )}
                                                        {parsed.context && !parsed.url && (
                                                            <span className="text-[10px] text-slate-500 truncate max-w-[130px] block" title={parsed.context}>
                                                                {parsed.context}
                                                            </span>
                                                        )}
                                                        {!parsed.url && !parsed.context && "—"}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
