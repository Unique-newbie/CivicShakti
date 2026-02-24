"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MapLayerSwitcher from "@/components/MapLayerSwitcher";
import "leaflet/dist/leaflet.css";
import { DivIcon } from "leaflet";
import { databases, appwriteConfig, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Badge } from "@/components/ui/badge";
import {
    Loader2, AlertTriangle, Droplets, Zap, Wind, Building2, Ban,
    Filter, Eye, EyeOff, Crosshair, MapPin
} from "lucide-react";

interface Complaint {
    $id: string;
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    image_url: string;
    status: string;
    lat: number;
    lng: number;
    department: string;
    $createdAt: string;
    upvotes?: number;
    upvoted_by?: string[];
}

const CATEGORIES: Record<string, { color: string; label: string; Icon: any }> = {
    pothole: { color: "#f59e0b", label: "Pothole", Icon: AlertTriangle },
    garbage: { color: "#10b981", label: "Garbage", Icon: Ban },
    water: { color: "#3b82f6", label: "Water Leak", Icon: Droplets },
    electricity: { color: "#eab308", label: "Streetlight", Icon: Zap },
    pollution: { color: "#64748b", label: "Pollution", Icon: Wind },
    infrastructure: { color: "#6366f1", label: "Infrastructure", Icon: Building2 },
    other: { color: "#8b5cf6", label: "Other", Icon: Building2 },
};

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    in_progress: "bg-blue-100 text-blue-800",
    progress: "bg-blue-100 text-blue-800",
    resolved: "bg-emerald-100 text-emerald-800",
    escalated: "bg-rose-100 text-rose-800 border border-rose-200",
};

const formatStatus = (s: string) =>
    s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);

const createCategoryIcon = (category: string) => {
    const color = CATEGORIES[category]?.color || "#3b82f6";
    return new DivIcon({
        className: "custom-leaflet-marker",
        html: `<div style="background:${color};width:26px;height:26px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
    });
};

// ─── Auto-locate user ─────────────────────────────────────
function MapLocate() {
    const map = useMap();
    useEffect(() => {
        map.locate({ setView: false }).on("locationfound", (e) => {
            map.flyTo(e.latlng, 13);
        });
    }, [map]);
    return null;
}

// ─── Locate button handler ────────────────────────────────
function LocateButton({ onLocate }: { onLocate: () => void }) {
    const map = useMap();
    const handleClick = () => {
        map.locate({ setView: false }).on("locationfound", (e) => {
            map.flyTo(e.latlng, 14);
        });
        onLocate();
    };
    return (
        <button
            onClick={handleClick}
            className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            title="Center on my location"
        >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">My Location</span>
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────
export default function PublicMap() {
    const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showResolved, setShowResolved] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [activeCategories, setActiveCategories] = useState<Set<string>>(
        new Set(Object.keys(CATEGORIES))
    );

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

        async function fetchComplaints() {
            try {
                // Fetch ALL complaints (we filter client-side for resolved toggle)
                const res = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [Query.limit(500), Query.orderDesc("$createdAt")]
                );
                const docs = res.documents as unknown as Complaint[];
                // Only keep complaints that have real coordinates
                setAllComplaints(docs.filter((d) => d.lat && d.lng));
            } catch (err) {
                console.error("Failed to load map data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchComplaints();
    }, []);

    // Filter complaints by category + resolved toggle
    const complaints = useMemo(() => {
        return allComplaints.filter((c) => {
            if (!showResolved && c.status === "resolved") return false;
            if (!activeCategories.has(c.category)) return false;
            return true;
        });
    }, [allComplaints, showResolved, activeCategories]);

    const toggleCategory = (cat: string) => {
        setActiveCategories((prev) => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border rounded-xl min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading civic MapData...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                scrollWheelZoom={true}
                className="absolute inset-0 z-0"
                style={{ zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapLocate />
                <MapLayerSwitcher position="bottom-right" />

                {complaints.map((comp) => (
                    <Marker
                        key={comp.$id}
                        position={[comp.lat, comp.lng]}
                        icon={createCategoryIcon(comp.category)}
                    >
                        <Popup className="civic-popup rounded-xl">
                            <div className="p-1 min-w-[220px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                        variant="secondary"
                                        className={`${STATUS_STYLES[comp.status] || "bg-slate-100 text-slate-800"} font-medium`}
                                    >
                                        {formatStatus(comp.status)}
                                    </Badge>
                                    <span className="text-xs text-slate-500 font-medium uppercase truncate block">
                                        {comp.department || "Unassigned"}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-slate-900 text-lg capitalize mb-1">
                                    {comp.category}
                                </h3>
                                <p className="text-sm text-slate-600 line-clamp-3 mb-2">
                                    {comp.description}
                                </p>

                                {comp.address && (
                                    <p className="text-xs text-slate-400 mb-2 flex items-start gap-1">
                                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{comp.address}</span>
                                    </p>
                                )}

                                {comp.image_url && (
                                    <div className="h-24 w-full rounded-md overflow-hidden bg-slate-100 mb-3">
                                        <div
                                            className="w-full h-full bg-cover bg-center"
                                            style={{ backgroundImage: `url(${comp.image_url})` }}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                    <span className="text-xs text-slate-400 font-mono">
                                        #{comp.tracking_id}
                                    </span>
                                    <a
                                        href={`/track/${comp.tracking_id}`}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        View Details &rarr;
                                    </a>
                                </div>

                                {/* Upvote */}
                                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const user = await account.get().catch(() => null);
                                                if (!user) {
                                                    import("sonner").then((m) =>
                                                        m.toast.error("You must be logged in to upvote.")
                                                    );
                                                    return;
                                                }
                                                const currentUpvotedBy = comp.upvoted_by || [];
                                                if (currentUpvotedBy.includes(user.$id)) {
                                                    import("sonner").then((m) =>
                                                        m.toast.info("You have already upvoted this issue.")
                                                    );
                                                    return;
                                                }
                                                await databases.updateDocument(
                                                    appwriteConfig.databaseId,
                                                    appwriteConfig.complaintsCollectionId,
                                                    comp.$id,
                                                    {
                                                        upvotes: (comp.upvotes || 0) + 1,
                                                        upvoted_by: [...currentUpvotedBy, user.$id],
                                                    }
                                                );
                                                import("sonner").then((m) =>
                                                    m.toast.success("Thanks for endorsing this issue!")
                                                );
                                            } catch (e: any) {
                                                console.error(e);
                                                import("sonner").then((m) =>
                                                    m.toast.error("Failed to upvote.")
                                                );
                                            }
                                        }}
                                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-colors"
                                    >
                                        <span className="text-sm">👍</span>
                                        <span>Endorse ({comp.upvotes || 0})</span>
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* ── Floating Controls ──────────────────────── */}

            {/* Count Badge */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-slate-200">
                <span className="text-sm font-semibold text-slate-800">
                    {complaints.length}
                </span>
                <span className="text-xs text-slate-500 ml-1">issues on map</span>
            </div>

            {/* Filter Toggle */}
            <button
                onClick={() => setShowFilters((f) => !f)}
                className="absolute top-3 left-40 z-[1000] flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-md text-sm font-medium text-slate-700 hover:bg-blue-50 transition-colors"
            >
                <Filter className="w-4 h-4" />
                Filters
            </button>

            {/* Resolved Toggle */}
            <button
                onClick={() => setShowResolved((r) => !r)}
                className={`absolute top-3 left-[232px] z-[1000] flex items-center gap-1.5 px-3 py-2 border rounded-lg shadow-md text-sm font-medium transition-colors ${showResolved
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500"
                    }`}
            >
                {showResolved ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="hidden sm:inline">Resolved</span>
            </button>

            {/* Filter Panel */}
            {showFilters && (
                <div className="absolute top-14 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-slate-200 p-4 w-56 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Categories
                    </p>
                    <div className="space-y-2">
                        {Object.entries(CATEGORIES).map(([key, { color, label }]) => (
                            <label
                                key={key}
                                className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 rounded px-1.5 py-1 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={activeCategories.has(key)}
                                    onChange={() => toggleCategory(key)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-sm text-slate-700">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Legend
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {Object.entries(CATEGORIES).map(([key, { color, label }]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-[11px] text-slate-600">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
