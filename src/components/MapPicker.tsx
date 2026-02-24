"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import MapLayerSwitcher from "@/components/MapLayerSwitcher";
import "leaflet/dist/leaflet.css";
import { Search, Crosshair, Loader2, MapPin } from "lucide-react";

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    initialLat?: number;
    initialLng?: number;
}

// ─── Click handler ────────────────────────────────────────
function LocationSelector({
    onSelect,
    currentPos,
}: {
    onSelect: (lat: number, lng: number) => void;
    currentPos: [number, number] | null;
}) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return currentPos ? <Marker position={currentPos} /> : null;
}

// ─── Auto-locate on mount ─────────────────────────────────
function AutoLocate({
    onLocate,
    trigger,
}: {
    onLocate: (lat: number, lng: number) => void;
    trigger: number;
}) {
    const map = useMap();
    const located = useRef(false);

    useEffect(() => {
        // Auto-locate once on mount
        if (!located.current) {
            map.locate({ setView: false }).on("locationfound", (e) => {
                if (!located.current) {
                    map.flyTo(e.latlng, 15);
                    onLocate(e.latlng.lat, e.latlng.lng);
                    located.current = true;
                }
            });
        }
    }, [map, onLocate]);

    // Re-locate when user clicks "Detect" button
    useEffect(() => {
        if (trigger > 0) {
            map.locate({ setView: false }).on("locationfound", (e) => {
                map.flyTo(e.latlng, 16);
                onLocate(e.latlng.lat, e.latlng.lng);
            });
        }
    }, [trigger, map, onLocate]);

    return null;
}

// ─── Fly-to helper ────────────────────────────────────────
function FlyTo({ coords }: { coords: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.flyTo(coords, 16);
    }, [coords, map]);
    return null;
}

// ─── Reverse geocode (Nominatim) ──────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        return data.display_name || "";
    } catch {
        return "";
    }
}

// ─── Forward geocode (search) ─────────────────────────────
interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

async function forwardGeocode(query: string): Promise<SearchResult[]> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`,
            { headers: { "Accept-Language": "en" } }
        );
        return await res.json();
    } catch {
        return [];
    }
}

// ─── Main MapPicker Component ─────────────────────────────
export default function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
    const [pos, setPos] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
    const [detectTrigger, setDetectTrigger] = useState(0);
    const [detectingGPS, setDetectingGPS] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Leaflet icon fix
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

    // Close search dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (value.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            const results = await forwardGeocode(value);
            setSearchResults(results);
            setShowResults(results.length > 0);
            setSearching(false);
        }, 400);
    };

    // Select a location (from click, search, or GPS)
    const selectLocation = useCallback(
        async (lat: number, lng: number) => {
            setPos([lat, lng]);
            setFlyTarget([lat, lng]);
            const addr = await reverseGeocode(lat, lng);
            onLocationSelect(lat, lng, addr);
        },
        [onLocationSelect]
    );

    // Search result click
    const handleSearchSelect = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setSearchQuery(result.display_name);
        setShowResults(false);
        selectLocation(lat, lng);
    };

    // GPS detect button
    const handleDetectLocation = () => {
        setDetectingGPS(true);
        setDetectTrigger((t) => t + 1);
        // Fallback: use navigator.geolocation directly
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await selectLocation(latitude, longitude);
                    setDetectingGPS(false);
                },
                () => setDetectingGPS(false),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setDetectingGPS(false);
        }
    };

    const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

    return (
        <div className="flex flex-col h-full w-full">
            {/* Search Bar + Detect Button */}
            <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2" ref={searchRef}>
                <div className="relative flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search location…"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {searchResults.map((r, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSearchSelect(r)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-start gap-2 border-b border-slate-50 last:border-0"
                                >
                                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                    <span className="text-slate-700 line-clamp-2">{r.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detect My Location Button */}
                <button
                    onClick={handleDetectLocation}
                    disabled={detectingGPS}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-lg shadow-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors disabled:opacity-60 shrink-0"
                    title="Detect my location"
                >
                    {detectingGPS ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                        <Crosshair className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Locate Me</span>
                </button>
            </div>

            {/* Map */}
            <MapContainer
                center={pos || defaultCenter}
                zoom={pos ? 15 : 5}
                className="absolute inset-0 z-0"
                style={{ zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <AutoLocate onLocate={selectLocation} trigger={detectTrigger} />
                <FlyTo coords={flyTarget} />
                <LocationSelector onSelect={selectLocation} currentPos={pos} />
                <MapLayerSwitcher position="bottom-right" />
            </MapContainer>

            {/* Coordinates Display */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-slate-200">
                {pos ? (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-mono font-medium text-slate-700">
                            {pos[0].toFixed(5)}, {pos[1].toFixed(5)}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Click map to drop pin
                    </span>
                )}
            </div>
        </div>
    );
}
