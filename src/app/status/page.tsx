"use client";

import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { 
    Activity, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle,
    RefreshCw,
    Server,
    Database,
    Clock,
    Users,
    HardDrive,
    Cpu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

interface ServiceHealth {
    status: "operational" | "outage" | "degraded";
    latency: number;
    name: string;
}

interface HealthStatus {
    status: "operational" | "outage" | "degraded";
    latency: number;
    timestamp: string;
    services: Record<string, ServiceHealth>;
}

export default function StatusPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            // Add cache busting
            const res = await fetch(`/api/health?t=${Date.now()}`);
            const data = await res.json();
            
            // Even if it's 503, our API returns the structured JSON data
            if (data.status) {
                setHealth(data);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err) {
            console.error("Failed to check status:", err);
            // This happens if the Next.js server itself is down or network is disconnected
            setError("Could not reach servers to verify status.");
            setHealth({
                status: "outage",
                latency: 0,
                timestamp: new Date().toISOString(),
                services: {
                    api: { status: "outage", latency: 0, name: "API Gateway" },
                    database: { status: "outage", latency: 0, name: "Database" },
                    auth: { status: "outage", latency: 0, name: "Authentication" },
                    storage: { status: "outage", latency: 0, name: "Storage" },
                    ai: { status: "outage", latency: 0, name: "AI Analysis" }
                }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        
        // Auto-refresh every 60 seconds
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "operational":
                return {
                    icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
                    bg: "bg-emerald-50/50",
                    border: "border-emerald-200",
                    text: "text-emerald-700",
                    label: "All Systems Operational"
                };
            case "degraded":
                return {
                    icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
                    bg: "bg-amber-50/50",
                    border: "border-amber-200",
                    text: "text-amber-700",
                    label: "Degraded Performance"
                };
            default:
                return {
                    icon: <XCircle className="w-12 h-12 text-rose-500" />,
                    bg: "bg-rose-50/50",
                    border: "border-rose-200",
                    text: "text-rose-700",
                    label: "Major System Outage"
                };
        }
    };

    const statusInfo = getStatusInfo(health?.status || "outage");

    return (
        <div className={`min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 ${inter.className}`}>
            <div className="w-full max-w-3xl space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-600" />
                            CivicShakti Status
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Real-time status of services and APIs
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={checkStatus}
                        disabled={loading}
                        className="bg-white"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Overall Status Banner */}
                <Card className={`${statusInfo.border} ${statusInfo.bg} shadow-sm transition-colors duration-500`}>
                    <CardContent className="p-8 flex items-center gap-6">
                        <div className="bg-white p-3 rounded-2xl shadow-sm">
                            {statusInfo.icon}
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold ${statusInfo.text}`}>
                                {loading && !health ? "Checking status..." : statusInfo.label}
                            </h2>
                            <p className="text-slate-600 mt-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 opacity-70" />
                                {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "..."}
                            </p>
                            {error && (
                                <p className="text-rose-600 text-sm mt-2 font-medium">
                                    {error}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Services Status Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(health?.services || {}).map(([key, service]) => {
                        let Icon = Server;
                        if (key === 'database') Icon = Database;
                        if (key === 'auth') Icon = Users;
                        if (key === 'storage') Icon = HardDrive;
                        if (key === 'ai') Icon = Cpu;

                        return (
                            <Card key={key} className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Icon className="w-5 h-5 text-slate-500" />
                                        {service.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-600">Status</span>
                                        {service.status === "operational" ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                Operational
                                            </span>
                                        ) : service.status === "degraded" ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                Degraded
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                                Outage
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Latency</span>
                                        <span className="font-mono text-slate-700">
                                            {service.latency !== undefined ? `${service.latency}ms` : '---'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="text-center text-sm text-slate-500 mt-8">
                    Page auto-refreshes every 60 seconds.
                </div>
            </div>
        </div>
    );
}
