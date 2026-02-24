"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import MapLayerSwitcher from "@/components/MapLayerSwitcher";
import "leaflet/dist/leaflet.css";
import { DivIcon } from "leaflet";
import { Badge } from "@/components/ui/badge";

interface MapComplaint {
    $id: string;
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    lat: number;
    lng: number;
    department: string;
    $createdAt: string;
    ai_priority_score?: number;
}

interface StaffHeatmapProps {
    complaints: MapComplaint[];
    flyTo?: [number, number] | null;
    getSeverityColor?: (complaint: MapComplaint) => string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    in_progress: "#3b82f6",
    progress: "#3b82f6",
    resolved: "#10b981",
    escalated: "#ef4444",
};

const createSeverityIcon = (complaint: MapComplaint) => {
    // Color based on AI priority score
    const score = complaint.ai_priority_score || 0;
    let color = "#3b82f6"; // blue (normal)
    let size = 20;
    if (score >= 70) {
        color = "#ef4444"; // red (critical)
        size = 28;
    } else if (score >= 40) {
        color = "#f59e0b"; // amber (high)
        size = 24;
    }

    // Override with status color for escalated/resolved
    if (complaint.status === "escalated") { color = "#ef4444"; size = 28; }
    if (complaint.status === "resolved") { color = "#10b981"; size = 18; }

    return new DivIcon({
        className: "staff-heatmap-marker",
        html: `<div style="
            background:${color};
            width:${size}px;height:${size}px;
            border-radius:50%;
            border:2px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3)${score >= 70 ? `,0 0 12px ${color}60` : ""};
            opacity:${complaint.status === "resolved" ? "0.5" : "1"};
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
};

// ─── FlyTo helper ─────────────────────────────────────────
function FlyToHandler({ coords }: { coords: [number, number] | null }) {
    const map = useMap();
    const prevCoords = useRef<string | null>(null);
    useEffect(() => {
        const key = coords ? `${coords[0]},${coords[1]}` : null;
        if (coords && key !== prevCoords.current) {
            map.flyTo(coords, 14, { duration: 1.2 });
            prevCoords.current = key;
        }
    }, [coords, map]);
    return null;
}

export default function StaffHeatmap({ complaints, flyTo }: StaffHeatmapProps) {
    // Only render markers with valid coordinates
    const mappable = complaints.filter((c) => c.lat && c.lng);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const L = require("leaflet");
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
        }
    }, []);

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                zoomControl={false}
                scrollWheelZoom={true}
                className="absolute inset-0"
                style={{ zIndex: 0 }}
            >
                <ZoomControl position="bottomright" />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyToHandler coords={flyTo || null} />
                <MapLayerSwitcher />

                {mappable.map((comp) => (
                    <Marker
                        key={comp.$id}
                        position={[comp.lat, comp.lng]}
                        icon={createSeverityIcon(comp)}
                    >
                        <Popup>
                            <div className="p-1 min-w-[200px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-sm font-bold text-slate-800">
                                        #{comp.tracking_id}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className={`text-xs capitalize ${comp.status === "escalated"
                                            ? "bg-rose-100 text-rose-700"
                                            : comp.status === "resolved"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : comp.status === "pending"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}
                                    >
                                        {comp.status === "in_progress" ? "In Progress" : comp.status}
                                    </Badge>
                                </div>
                                <p className="text-sm font-semibold capitalize text-slate-900 mb-1">
                                    {comp.category}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                    {comp.description}
                                </p>
                                {comp.ai_priority_score !== undefined && (
                                    <div className="flex items-center gap-2 text-xs mb-2">
                                        <span className="text-slate-400">AI Priority:</span>
                                        <span
                                            className={`font-bold ${comp.ai_priority_score >= 70
                                                ? "text-rose-600"
                                                : comp.ai_priority_score >= 40
                                                    ? "text-amber-600"
                                                    : "text-blue-600"
                                                }`}
                                        >
                                            {comp.ai_priority_score}/100
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400">
                                        {formatTimeAgo(comp.$createdAt)}
                                    </span>
                                    <a
                                        href={`/staff/complaints/${comp.tracking_id}`}
                                        className="text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                        Open →
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Priority
                </p>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                        <span className="text-[11px] text-slate-600">Critical (70+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[11px] text-slate-600">High (40-69)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-[11px] text-slate-600">Normal (0-39)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-50" />
                        <span className="text-[11px] text-slate-600">Resolved</span>
                    </div>
                </div>
            </div>

            {/* Marker count */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-slate-200">
                <span className="text-sm font-bold text-slate-800">{mappable.length}</span>
                <span className="text-xs text-slate-500 ml-1">mapped complaints</span>
            </div>
        </div>
    );
}
