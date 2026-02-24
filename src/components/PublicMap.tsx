"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, DivIcon } from "leaflet";
import { databases, appwriteConfig, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Droplets, Zap, Wind, Building2, Ban } from "lucide-react";

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

const CATEGORY_ICONS: Record<string, { color: string, Icon: any }> = {
    pothole: { color: "#f59e0b", Icon: AlertTriangle },
    garbage: { color: "#10b981", Icon: Ban },
    water: { color: "#3b82f6", Icon: Droplets },
    electricity: { color: "#eab308", Icon: Zap },
    pollution: { color: "#64748b", Icon: Wind },
    infrastructure: { color: "#6366f1", Icon: Building2 },
    other: { color: "#6366f1", Icon: Building2 },
};

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-amber-100 text-amber-800';
        case 'in_progress':
        case 'progress': return 'bg-blue-100 text-blue-800';
        case 'resolved': return 'bg-emerald-100 text-emerald-800';
        case 'escalated': return 'bg-rose-100 text-rose-800 border border-rose-200';
        default: return 'bg-slate-100 text-slate-800';
    }
};

const formatStatus = (status: string) => {
    if (status === 'in_progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

// Create a custom icon function that uses HTML
const createCustomIcon = (category: string) => {
    const color = CATEGORY_ICONS[category]?.color || "#3b82f6";
    return new DivIcon({
        className: "custom-leaflet-marker",
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

function MapLocate() {
    const map = useMap();
    useEffect(() => {
        // Try to locate user on map load
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, map.getZoom());
        });
    }, [map]);
    return null;
}

export default function PublicMap() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fix Leaflet missing icon issue in Next.js
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
                // Fetch non-resolved complaints
                const res = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [
                        Query.notEqual("status", "resolved"),
                        Query.limit(500),
                        Query.orderDesc("$createdAt")
                    ]
                );

                // Note: The schema might not have lat/lng populated yet if the placeholder map was used.
                // For demonstration, we will filter out ones without lat/lng, or assign them dummy coordinates near a city center if missing.
                const docs = res.documents as unknown as Complaint[];

                // Map over docs to ensure lat/lng exists just for the demo visualization
                const mappedDocs = docs.map((doc, idx) => {
                    if (!doc.lat || !doc.lng) {
                        // Dummy coordinates around New York for demonstration if missing
                        return {
                            ...doc,
                            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                            lng: -74.0060 + (Math.random() - 0.5) * 0.1
                        };
                    }
                    return doc;
                });

                setComplaints(mappedDocs);
            } catch (err) {
                console.error("Failed to load map data", err);
            } finally {
                setLoading(false);
            }
        }

        fetchComplaints();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border rounded-xl min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading civic MapData...</p>
            </div>
        );
    }

    return (
        <MapContainer
            center={[40.7128, -74.0060]}
            zoom={12}
            scrollWheelZoom={true}
            className="absolute inset-0 z-0"
            style={{ zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* <MapLocate /> */}

            {complaints.map((comp) => (
                <Marker
                    key={comp.$id}
                    position={[comp.lat, comp.lng]}
                    icon={createCustomIcon(comp.category)}
                >
                    <Popup className="civic-popup rounded-xl">
                        <div className="p-1 min-w-[220px]">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className={`${getStatusStyle(comp.status)} font-medium`}>
                                    {formatStatus(comp.status)}
                                </Badge>
                                <span className="text-xs text-slate-500 font-medium uppercase truncate block">
                                    {comp.department || 'Unassigned'}
                                </span>
                            </div>

                            <h3 className="font-semibold text-slate-900 text-lg capitalize mb-1">{comp.category}</h3>
                            <p className="text-sm text-slate-600 line-clamp-3 mb-3">{comp.description}</p>

                            {comp.image_url && (
                                <div className="h-24 w-full rounded-md overflow-hidden bg-slate-100 mb-3">
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${comp.image_url})` }}></div>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                <span className="text-xs text-slate-400">#{comp.tracking_id}</span>
                                <div className="flex flex-col items-end gap-1">
                                    <a href={`/track/${comp.tracking_id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                                        View Details &rarr;
                                    </a>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={async () => {
                                        try {
                                            const user = await account.get().catch(() => null);
                                            if (!user) {
                                                import("sonner").then(m => m.toast.error("You must be logged in to upvote."));
                                                return;
                                            }

                                            // Check if already upvoted
                                            const currentUpvotedBy = comp.upvoted_by || [];
                                            if (currentUpvotedBy.includes(user.$id)) {
                                                import("sonner").then(m => m.toast.info("You have already upvoted this issue."));
                                                return;
                                            }

                                            // Upvote
                                            const updatedDoc = await databases.updateDocument(
                                                appwriteConfig.databaseId,
                                                appwriteConfig.complaintsCollectionId,
                                                comp.$id,
                                                {
                                                    upvotes: (comp.upvotes || 0) + 1,
                                                    upvoted_by: [...currentUpvotedBy, user.$id]
                                                }
                                            );

                                            // Local state update
                                            setComplaints(prev => prev.map(c =>
                                                c.$id === comp.$id ? { ...c, upvotes: updatedDoc.upvotes, upvoted_by: updatedDoc.upvoted_by } : c
                                            ));

                                            import("sonner").then(m => m.toast.success("Thanks for endorsing this issue!"));
                                        } catch (e: any) {
                                            console.error(e);
                                            import("sonner").then(m => m.toast.error("Failed to upvote."));
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
    );
}
