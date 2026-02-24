"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

// Internal component to handle clicks
function LocationSelector({ onLocationSelect, currentPos }: { onLocationSelect: (lat: number, lng: number) => void, currentPos: [number, number] | null }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return currentPos ? <Marker position={currentPos} /> : null;
}

// Internal component to re-center map if geolocation is found
function MapLocate({ setPos }: { setPos: (pos: [number, number]) => void }) {
    const map = useMap();
    const located = useRef(false);

    useEffect(() => {
        if (!located.current) {
            map.locate().on("locationfound", function (e) {
                if (!located.current) {
                    map.flyTo(e.latlng, 15);
                    setPos([e.latlng.lat, e.latlng.lng]);
                    located.current = true;
                }
            });
        }
    }, [map, setPos]);

    return null;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
    const [pos, setPos] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );

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
    }, []);

    const defaultCenter: [number, number] = [40.7128, -74.0060]; // NY

    const handleSelect = (lat: number, lng: number) => {
        setPos([lat, lng]);
        onLocationSelect(lat, lng);
    };

    return (
        <MapContainer
            center={pos || defaultCenter}
            zoom={pos ? 15 : 12}
            className="absolute inset-0 z-0"
            style={{ zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {!pos && <MapLocate setPos={(p) => handleSelect(p[0], p[1])} />}
            <LocationSelector onLocationSelect={handleSelect} currentPos={pos} />
        </MapContainer>
    );
}
