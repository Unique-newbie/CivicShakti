"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DivIcon } from "leaflet";

interface MiniMapProps {
    lat: number;
    lng: number;
}

const customIcon = new DivIcon({
    className: "custom-minimap-marker",
    html: `<div style="background:#f43f5e;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

export default function MiniMap({ lat, lng }: MiniMapProps) {
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
        <MapContainer
            center={[lat, lng]}
            zoom={14}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            touchZoom={false}
            className="w-full h-full"
            style={{ zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={customIcon} />
        </MapContainer>
    );
}
