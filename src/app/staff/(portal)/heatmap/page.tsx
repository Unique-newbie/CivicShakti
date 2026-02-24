"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Loader2, MapPin, AlertTriangle, List, Grid3X3,
    ChevronRight, Clock, TrendingUp, Map as MapIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { databases, appwriteConfig } from "@/lib/appwrite";
import { Query, Models } from "appwrite";
import { getSLAStatus } from "@/lib/slas";

// Dynamically import map (no SSR for Leaflet)
const StaffHeatmap = dynamic(() => import("@/components/StaffHeatmap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 animate-pulse">
            <p className="text-slate-500 font-medium">Loading Map…</p>
        </div>
    ),
});

interface Complaint extends Models.Document {
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    department: string;
    ai_priority_score?: number;
    upvotes?: number;
    lat?: number;
    lng?: number;
}

interface Hotspot {
    id: string;
    label: string;
    count: number;
    severity: "critical" | "high" | "normal";
    topCategories: { name: string; count: number }[];
    slaBreached: number;
    avgPriority: number;
    avgLat: number | null;
    avgLng: number | null;
    complaints: Complaint[];
}

const SEVERITY_COLORS = {
    critical: { bg: "bg-rose-500", ring: "ring-rose-400/40", text: "text-rose-700", badge: "bg-rose-100 text-rose-700", glow: "shadow-[0_0_25px_rgba(244,63,94,0.4)]" },
    high: { bg: "bg-amber-500", ring: "ring-amber-400/40", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]" },
    normal: { bg: "bg-blue-500", ring: "ring-blue-400/40", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", glow: "" },
};

const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
};

export default function HeatmapAnalytics() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
    const [sortBy, setSortBy] = useState<"count" | "severity" | "priority">("count");
    const [mapFlyTo, setMapFlyTo] = useState<[number, number] | null>(null);

    useEffect(() => {
        async function fetchComplaints() {
            try {
                const res = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [Query.orderDesc("$createdAt"), Query.limit(500)]
                );
                setComplaints(res.documents as unknown as Complaint[]);
            } catch (error) {
                console.error("Error fetching complaints:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchComplaints();
    }, []);

    const hotspots = useMemo(() => {
        const areaMap: Record<string, Complaint[]> = {};

        complaints.forEach(c => {
            let areaKey = "Unknown Area";
            if (c.address) {
                const parts = c.address.split(",");
                areaKey = parts.length >= 2 ? parts[parts.length - 2].trim() : parts[0].trim();
                if (areaKey.length < 3) areaKey = parts[0].trim();
            }
            if (!areaMap[areaKey]) areaMap[areaKey] = [];
            areaMap[areaKey].push(c);
        });

        const spots: Hotspot[] = Object.entries(areaMap).map(([label, items]) => {
            const catCounts: Record<string, number> = {};
            let totalPriority = 0, priorityCount = 0, slaBreached = 0;
            let latSum = 0, lngSum = 0, coordCount = 0;

            items.forEach(c => {
                catCounts[c.category] = (catCounts[c.category] || 0) + 1;
                if (c.ai_priority_score !== undefined) {
                    totalPriority += c.ai_priority_score;
                    priorityCount++;
                }
                if (c.status !== 'resolved') {
                    const sla = getSLAStatus(c.$createdAt, c.category, c.status);
                    if (sla.status === 'breached') slaBreached++;
                }
                if (c.lat && c.lng) {
                    latSum += c.lat;
                    lngSum += c.lng;
                    coordCount++;
                }
            });

            const topCategories = Object.entries(catCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, count]) => ({ name, count }));

            const avgPriority = priorityCount > 0 ? Math.round(totalPriority / priorityCount) : 0;
            const severity: "critical" | "high" | "normal" =
                items.length >= 10 || slaBreached >= 3 ? "critical" :
                    items.length >= 5 || slaBreached >= 1 ? "high" : "normal";

            return {
                id: label,
                label,
                count: items.length,
                severity,
                topCategories,
                slaBreached,
                avgPriority,
                avgLat: coordCount > 0 ? latSum / coordCount : null,
                avgLng: coordCount > 0 ? lngSum / coordCount : null,
                complaints: items.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
            };
        });

        if (sortBy === "count") spots.sort((a, b) => b.count - a.count);
        else if (sortBy === "severity") spots.sort((a, b) => {
            const order = { critical: 0, high: 1, normal: 2 };
            return order[a.severity] - order[b.severity] || b.count - a.count;
        });
        else if (sortBy === "priority") spots.sort((a, b) => b.avgPriority - a.avgPriority);

        return spots;
    }, [complaints, sortBy]);

    const totalHotspots = hotspots.length;
    const criticalCount = hotspots.filter(h => h.severity === "critical").length;
    const highCount = hotspots.filter(h => h.severity === "high").length;
    const totalBreached = hotspots.reduce((sum, h) => sum + h.slaBreached, 0);

    const handleHotspotClick = (spot: Hotspot) => {
        setSelectedHotspot(spot);
        if (spot.avgLat && spot.avgLng) {
            setMapFlyTo([spot.avgLat, spot.avgLng]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500 font-medium">Analyzing complaint distribution...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint Hotspot Analysis</h1>
                    <p className="text-slate-500 mt-1">Geographic density analysis of {complaints.length} complaints across {totalHotspots} areas.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white border border-slate-200 rounded-sm p-0.5">
                        <button onClick={() => setViewMode("grid")} className={`p-2 rounded-sm transition-colors ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode("list")} className={`p-2 rounded-sm transition-colors ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <select
                        className="h-9 px-3 text-sm rounded-sm border border-slate-200 bg-white"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="count">Sort by Count</option>
                        <option value="severity">Sort by Severity</option>
                        <option value="priority">Sort by AI Priority</option>
                    </select>
                </div>
            </div>

            {/* ── Interactive Map ──────────────────────── */}
            <Card className="rounded-sm border-slate-200 shadow-none overflow-hidden">
                <CardHeader className="pb-2 border-b border-slate-100">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-blue-600" />
                        Live Complaint Map
                    </CardTitle>
                    <CardDescription>Click on a hotspot card below to zoom into that area</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[400px] relative">
                        <StaffHeatmap
                            complaints={complaints as any}
                            flyTo={mapFlyTo}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="rounded-sm border-slate-200 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-sm bg-slate-100"><MapPin className="w-5 h-5 text-slate-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalHotspots}</p>
                            <p className="text-xs text-slate-500">Unique Areas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-sm border-slate-200 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-sm bg-rose-100"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-rose-600">{criticalCount}</p>
                            <p className="text-xs text-slate-500">Critical Zones</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-sm border-slate-200 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-sm bg-amber-100"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{highCount}</p>
                            <p className="text-xs text-slate-500">High Zones</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-sm border-slate-200 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-sm bg-rose-100"><Clock className="w-5 h-5 text-rose-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-rose-600">{totalBreached}</p>
                            <p className="text-xs text-slate-500">SLA Breached</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-300/50 animate-pulse" /><span className="text-slate-600">Critical (10+ issues)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-300/50" /><span className="text-slate-600">High (5+ issues)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-slate-600">Normal</span></div>
            </div>

            {/* Hotspot Detail Panel */}
            {selectedHotspot && (
                <Card className="rounded-sm border-blue-200 bg-blue-50/30 shadow-none animate-in slide-in-from-top-2 duration-300">
                    <CardHeader className="pb-3 border-b border-blue-100/50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5" /> {selectedHotspot.label}
                            </CardTitle>
                            <CardDescription>{selectedHotspot.count} complaints in this area</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedHotspot(null)}>✕</Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-3 bg-white rounded-sm border border-blue-100">
                                <p className="text-lg font-bold text-slate-900">{selectedHotspot.avgPriority}/100</p>
                                <p className="text-xs text-slate-500">Avg AI Priority</p>
                            </div>
                            <div className="text-center p-3 bg-white rounded-sm border border-blue-100">
                                <p className="text-lg font-bold text-rose-600">{selectedHotspot.slaBreached}</p>
                                <p className="text-xs text-slate-500">SLA Breached</p>
                            </div>
                            <div className="text-center p-3 bg-white rounded-sm border border-blue-100">
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                    {selectedHotspot.topCategories.map(tc => (
                                        <Badge key={tc.name} variant="secondary" className="text-xs capitalize">{tc.name} ({tc.count})</Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Top Categories</p>
                            </div>
                        </div>

                        <div className="divide-y divide-blue-100 max-h-60 overflow-y-auto rounded-sm border border-blue-100 bg-white">
                            {selectedHotspot.complaints.slice(0, 10).map(c => (
                                <div
                                    key={c.$id}
                                    onClick={() => router.push(`/staff/complaints/${c.tracking_id}`)}
                                    className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="font-mono text-sm font-semibold text-slate-800">#{c.tracking_id}</span>
                                        <span className="text-sm text-slate-500 capitalize truncate">{c.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-slate-400">{formatTimeAgo(c.$createdAt)}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotspots.map((spot) => {
                        const sc = SEVERITY_COLORS[spot.severity];
                        return (
                            <Card
                                key={spot.id}
                                onClick={() => handleHotspotClick(spot)}
                                className={`rounded-sm shadow-none border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${spot.severity === 'critical' ? 'border-rose-200 bg-rose-50/20' : spot.severity === 'high' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}`}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full ${sc.bg} flex items-center justify-center text-white font-bold text-sm ring-4 ${sc.ring} ${spot.severity === 'critical' ? 'animate-pulse' : ''} ${sc.glow}`}>
                                                {spot.count}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-sm truncate max-w-[150px]">{spot.label}</h3>
                                                <p className="text-xs text-slate-500">{spot.count} complaint{spot.count !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`text-xs ${sc.badge}`}>
                                            {spot.severity.charAt(0).toUpperCase() + spot.severity.slice(1)}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="bg-slate-50 rounded-sm p-2.5 text-center border border-slate-100">
                                            <p className="text-sm font-bold text-slate-900">{spot.avgPriority}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Priority</p>
                                        </div>
                                        <div className={`rounded-sm p-2.5 text-center border ${spot.slaBreached > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <p className={`text-sm font-bold ${spot.slaBreached > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{spot.slaBreached}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">SLA Breach</p>
                                        </div>
                                    </div>

                                    {/* Location indicator */}
                                    {spot.avgLat && spot.avgLng && (
                                        <div className="flex items-center gap-1 mb-3 text-xs text-blue-600">
                                            <MapPin className="w-3 h-3" />
                                            <span>Click to zoom on map</span>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-1.5">
                                        {spot.topCategories.map(tc => (
                                            <Badge key={tc.name} variant="secondary" className="text-[10px] capitalize bg-white border border-slate-100">
                                                {tc.name} ({tc.count})
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="rounded-sm border-slate-200 shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Area</th>
                                    <th className="px-6 py-3">Complaints</th>
                                    <th className="px-6 py-3">Severity</th>
                                    <th className="px-6 py-3">Avg Priority</th>
                                    <th className="px-6 py-3">SLA Breached</th>
                                    <th className="px-6 py-3">Top Categories</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {hotspots.map(spot => {
                                    const sc = SEVERITY_COLORS[spot.severity];
                                    return (
                                        <tr key={spot.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleHotspotClick(spot)}>
                                            <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="truncate max-w-[200px]">{spot.label}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-900">{spot.count}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`text-xs ${sc.badge}`}>
                                                    {spot.severity.charAt(0).toUpperCase() + spot.severity.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${spot.avgPriority >= 60 ? 'text-rose-600' : spot.avgPriority >= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {spot.avgPriority}/100
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {spot.slaBreached > 0 ? (
                                                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">{spot.slaBreached}</Badge>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    {spot.topCategories.slice(0, 2).map(tc => (
                                                        <Badge key={tc.name} variant="secondary" className="text-xs capitalize">{tc.name}</Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                                    View <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {hotspots.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                    <MapPin className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium">No hotspot data available.</p>
                    <p className="text-sm mt-1">Complaints will be grouped by location as they come in.</p>
                </div>
            )}
        </div>
    );
}
