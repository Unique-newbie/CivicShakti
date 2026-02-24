"use client";

import { useState, useEffect } from "react";
import {
    Map as MapIcon,
    ListTodo,
    MapPin,
    AlertTriangle,
    ZoomIn,
    ZoomOut,
    Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { databases, appwriteConfig } from "@/lib/appwrite";
import { Query } from "appwrite";

// Predefined positions for different categories to simulate a heatmap
const CLUSTER_POSITIONS: Record<string, { top: number; left: number }> = {
    pothole: { top: 40, left: 30 },
    garbage: { top: 60, left: 70 },
    electricity: { top: 25, left: 65 },
    water: { top: 75, left: 40 },
    pollution: { top: 50, left: 50 },
    infrastructure: { top: 80, left: 80 },
    other: { top: 30, left: 85 }
};

interface HotspotCluster {
    id: string;
    count: number;
    category: string;
    severity: "normal" | "high" | "critical";
    top: number;
    left: number;
}

export default function HeatmapView() {
    const [viewMode, setViewMode] = useState<"map" | "list">("map");
    const [hotspots, setHotspots] = useState<HotspotCluster[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClusters = async () => {
            try {
                // Fetch non-resolved complaints
                const response = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [
                        Query.notEqual("status", "resolved"),
                        Query.limit(500)
                    ]
                );

                const complaints = response.documents;

                // Group by category
                const categoryCounts: Record<string, number> = {};
                complaints.forEach((c) => {
                    const cat = (c.category || "other").toLowerCase();
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });

                // Map to HotspotCluster format
                const clusters: HotspotCluster[] = Object.keys(categoryCounts).map((cat) => {
                    const count = categoryCounts[cat];
                    const severity = count >= 15 ? "critical" : count >= 5 ? "high" : "normal";
                    const position = CLUSTER_POSITIONS[cat] || {
                        top: Math.random() * 60 + 20,
                        left: Math.random() * 60 + 20
                    };

                    return {
                        id: cat,
                        category: cat,
                        count,
                        severity,
                        top: position.top,
                        left: position.left
                    };
                });

                setHotspots(clusters);
            } catch (error) {
                console.error("Failed to fetch complaint clusters:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClusters();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">

            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Geospatial Heatmap</h1>
                    <p className="text-slate-500 mt-1">Visualize complaint density across Central Ward.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-300">
                    <button
                        onClick={() => setViewMode("map")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors text-sm font-medium ${viewMode === 'map' ? 'bg-white shadow-none border border-slate-300 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <MapIcon className="w-4 h-4" /> Map View
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors text-sm font-medium ${viewMode === 'list' ? 'bg-white shadow-none border border-slate-300 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ListTodo className="w-4 h-4" /> Cluster List
                    </button>
                </div>
            </div>

            {/* Main Map Area */}
            <Card className="flex-1 rounded-sm border-slate-300 shadow-none overflow-hidden flex flex-col relative w-full h-full min-h-[400px]">
                {/* Map Placeholder Overlay */}
                <div className="absolute top-4 left-4 z-10 space-y-2">
                    <Card className="shadow-none border border-slate-300 rounded-sm bg-white/90 backdrop-blur-sm p-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Severity Legend</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"></div> Critical (15+) </div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]"></div> High (5-14) </div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Normal (1-4) </div>
                        </div>
                    </Card>
                </div>

                <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                    <Button size="icon" variant="secondary" className="bg-white shadow-md rounded-full"><ZoomIn className="w-4 h-4" /></Button>
                    <Button size="icon" variant="secondary" className="bg-white shadow-md rounded-full"><ZoomOut className="w-4 h-4" /></Button>
                </div>

                {isLoading ? (
                    <div className="flex-1 bg-slate-50 flex items-center justify-center flex-col gap-4 relative z-20 h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-slate-500 font-medium animate-pulse">Computing geospatial clusters...</p>
                    </div>
                ) : (
                    <div className="flex-1 bg-slate-100 relative overflow-hidden h-full">
                        {/* Fake map image */}
                        <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/12/2921/1706.png')] opacity-40 bg-cover bg-center mix-blend-multiply transition-transform duration-1000 hover:scale-105" />

                        {/* Hotspot rendering */}
                        <div className="absolute inset-0">
                            {viewMode === 'map' && hotspots.map((spot) => (
                                <div
                                    key={spot.id}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                                    style={{
                                        top: `${spot.top}%`,
                                        left: `${spot.left}%`
                                    }}
                                >
                                    <div className={`
                      relative flex items-center justify-center rounded-full text-white font-bold text-xs shadow-lg ring-2 ring-white
                      ${spot.severity === 'critical' ? 'bg-rose-500 w-12 h-12 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse' :
                                            spot.severity === 'high' ? 'bg-amber-500 w-10 h-10 shadow-[0_0_15px_rgba(245,158,11,0.6)]' :
                                                'bg-blue-500 w-8 h-8'}
                    `}>
                                        {spot.count}

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-xs whitespace-nowrap px-3 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                            <p className="font-semibold capitalize">{spot.category} Cluster</p>
                                            <p className="text-slate-300">{spot.count} active reports</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Handling empty state if no active hotspots exist */}
                            {viewMode === 'map' && hotspots.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-sm border border-slate-300 shadow-none text-center pointer-events-auto">
                                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                        <h3 className="font-semibold text-slate-800">No Active Hotspots</h3>
                                        <p className="text-slate-500 text-sm mt-1">There are currently no active complaints to map.</p>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'list' && (
                                <div className="absolute inset-0 bg-white/95 backdrop-blur-md p-6 overflow-y-auto pointer-events-auto z-20">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 sticky top-0 bg-white py-2">Active Problem Clusters</h3>

                                    {hotspots.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <p>No active complaint clusters found.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {hotspots.sort((a, b) => b.count - a.count).map(spot => (
                                                <div key={spot.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-sm border border-slate-300 hover:border-slate-400 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-sm text-white ${spot.severity === 'critical' ? 'bg-rose-500' : spot.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 capitalize">{spot.category} Zone</p>
                                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                {spot.severity.charAt(0).toUpperCase() + spot.severity.slice(1)} Severity
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold tracking-tight text-slate-800">{spot.count}</span>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Reports</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
