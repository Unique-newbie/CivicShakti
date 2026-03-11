"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Bell, Loader2, CheckCircle2, ArrowUpRight, Clock, AlertTriangle,
    ShieldAlert, ArrowRight, ChevronRight, Inbox
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientAuthNav } from "@/components/ClientAuthNav";
import { BackButton } from "@/components/BackButton";
import { getAuthJWT } from "@/lib/auth-helpers";

interface Notification {
    id: string;
    tracking_id: string;
    category: string;
    status_from: string;
    status_to: string;
    remarks: string | null;
    changed_by: string | null;
    created_at: string;
}

const STATUS_ICONS: Record<string, any> = {
    pending: Clock,
    reviewed: ShieldAlert,
    in_progress: ArrowRight,
    resolved: CheckCircle2,
    escalated: AlertTriangle,
};

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    reviewed: "bg-blue-100 text-blue-700",
    in_progress: "bg-blue-100 text-blue-700",
    resolved: "bg-emerald-100 text-emerald-700",
    escalated: "bg-rose-100 text-rose-700",
};

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        async function load() {
            const token = await getAuthJWT();
            if (!token) return;
            try {
                const res = await fetch("/api/notifications", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                    setTotal(data.total || 0);
                }
            } catch (e) {
                console.error("Failed to load notifications:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh] gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-slate-500 font-medium">Loading notifications...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton />
                        <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
                        {total > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{total}</Badge>
                        )}
                    </div>
                    <ClientAuthNav />
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {notifications.length === 0 ? (
                    <Card className="border-slate-200 shadow-none">
                        <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                            <Inbox className="w-12 h-12 text-slate-300" />
                            <p className="text-slate-500 font-medium">No notifications yet</p>
                            <p className="text-sm text-slate-400">
                                You'll see updates here when the status of your complaints changes.
                            </p>
                            <Link href="/report">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                                    Submit a Complaint
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n) => {
                            const StatusIcon = STATUS_ICONS[n.status_to] || Bell;
                            const statusColor = STATUS_COLORS[n.status_to] || "bg-slate-100 text-slate-600";
                            const formattedStatus = n.status_to.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

                            return (
                                <Link href={`/track?id=${n.tracking_id}`} key={n.id}>
                                    <Card className="border-slate-200 shadow-none hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer group">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${statusColor}`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            Complaint <span className="font-mono text-blue-600">#{n.tracking_id}</span> updated
                                                        </p>
                                                        <span className="text-xs text-slate-400 shrink-0">{formatTime(n.created_at)}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        Status changed to <Badge className={`${statusColor} border-0 text-[10px] ml-1`}>{formattedStatus}</Badge>
                                                    </p>
                                                    {n.remarks && (
                                                        <p className="text-xs text-slate-500 mt-1.5 italic">
                                                            &quot;{n.remarks}&quot;
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] capitalize">{n.category}</Badge>
                                                        {n.changed_by && (
                                                            <span className="text-[10px] text-slate-400">by {n.changed_by}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
