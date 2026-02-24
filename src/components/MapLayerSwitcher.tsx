"use client";

import { useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { Map, Mountain, Satellite, Layers } from "lucide-react";

export const MAP_STYLES = {
    street: {
        label: "Street",
        icon: Map,
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
        label: "Satellite",
        icon: Satellite,
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri &mdash; Sources: Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
    },
    topographic: {
        label: "Topo",
        icon: Mountain,
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    },
    dark: {
        label: "Dark",
        icon: Layers,
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    },
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;

interface MapLayerSwitcherProps {
    position?: "top-right" | "bottom-right";
}

export function MapTileLayer({ style }: { style: MapStyleKey }) {
    const cfg = MAP_STYLES[style];
    return <TileLayer key={style} attribution={cfg.attribution} url={cfg.url} />;
}

export default function MapLayerSwitcher({ position = "top-right" }: MapLayerSwitcherProps) {
    const [currentStyle, setCurrentStyle] = useState<MapStyleKey>("street");
    const [open, setOpen] = useState(false);
    const map = useMap();

    const handleChange = (key: MapStyleKey) => {
        setCurrentStyle(key);
        setOpen(false);
        // Remove existing tile layers and add new one
        map.eachLayer((layer: any) => {
            if (layer._url) map.removeLayer(layer);
        });
        const cfg = MAP_STYLES[key];
        const L = require("leaflet");
        L.tileLayer(cfg.url, { attribution: cfg.attribution }).addTo(map);
    };

    const posClass =
        position === "top-right"
            ? "top-3 right-3"
            : "bottom-3 right-3";

    return (
        <div className={`absolute ${posClass} z-[1000]`}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                title="Change map style"
            >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">{MAP_STYLES[currentStyle].label}</span>
            </button>

            {open && (
                <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 min-w-[140px]">
                    {(Object.entries(MAP_STYLES) as [MapStyleKey, (typeof MAP_STYLES)[MapStyleKey]][]).map(
                        ([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleChange(key)}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${currentStyle === key
                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                            : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {cfg.label}
                                </button>
                            );
                        }
                    )}
                </div>
            )}
        </div>
    );
}
