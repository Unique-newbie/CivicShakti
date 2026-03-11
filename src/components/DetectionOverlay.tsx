"use client";

import { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Scan, AlertTriangle } from "lucide-react";

export interface DetectionBox {
    class: string;
    score: number;
    bbox: [number, number, number, number]; // [x, y, width, height]
}

interface DetectionOverlayProps {
    /** Image source URL or object URL */
    imageSrc: string;
    /** Array of detected objects with bounding boxes */
    detections?: DetectionBox[];
    /** Civic category detected by the AI */
    category?: string;
    /** Overall severity score 0-100 */
    severity?: number;
    /** Overall confidence 0-100 */
    confidence?: number;
    /** Aspect ratio class — defaults to aspect-video */
    aspectClass?: string;
    /** Alt text for the image */
    alt?: string;
    /** Whether to show the legend bar */
    showLegend?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
    pothole: "#ef4444",     // red
    garbage: "#f59e0b",     // amber
    water: "#3b82f6",       // blue
    electricity: "#eab308", // yellow
    pollution: "#6b7280",   // gray
    infrastructure: "#8b5cf6", // violet
};

const SEVERITY_COLORS: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#d97706",
    low: "#16a34a",
};

function getSeverityLevel(score: number): string {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
}

/**
 * DetectionOverlay — Renders an image with AI detection bounding boxes drawn on top.
 * Uses a Canvas overlay positioned absolutely on top of the image to draw boxes,
 * labels, and confidence scores for each detected object.
 */
export function DetectionOverlay({
    imageSrc,
    detections = [],
    category,
    severity,
    confidence,
    aspectClass = "aspect-video",
    alt = "Evidence",
    showLegend = true,
}: DetectionOverlayProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Draw bounding boxes whenever the image loads or container resizes
    useEffect(() => {
        if (!imgLoaded || !canvasRef.current || !imgRef.current || !containerRef.current) return;
        if (detections.length === 0) return;

        const canvas = canvasRef.current;
        const img = imgRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Match canvas size to displayed image size
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Calculate scale factors from natural image size to displayed size
        const scaleX = rect.width / img.naturalWidth;
        const scaleY = rect.height / img.naturalHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const boxColor = CATEGORY_COLORS[category || ""] || "#3b82f6";

        detections.forEach((det, idx) => {
            const [x, y, w, h] = det.bbox;
            const dx = x * scaleX;
            const dy = y * scaleY;
            const dw = w * scaleX;
            const dh = h * scaleY;

            // Draw semi-transparent fill
            ctx.fillStyle = boxColor + "18"; // ~10% opacity
            ctx.fillRect(dx, dy, dw, dh);

            // Draw border — thicker for higher confidence
            const lineWidth = det.score > 0.6 ? 3 : 2;
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = lineWidth;
            ctx.setLineDash([]);
            ctx.strokeRect(dx, dy, dw, dh);

            // Draw corner brackets for emphasis
            const cornerLen = Math.min(dw, dh) * 0.2;
            ctx.lineWidth = lineWidth + 1;
            ctx.beginPath();
            // Top-left
            ctx.moveTo(dx, dy + cornerLen); ctx.lineTo(dx, dy); ctx.lineTo(dx + cornerLen, dy);
            // Top-right
            ctx.moveTo(dx + dw - cornerLen, dy); ctx.lineTo(dx + dw, dy); ctx.lineTo(dx + dw, dy + cornerLen);
            // Bottom-left
            ctx.moveTo(dx, dy + dh - cornerLen); ctx.lineTo(dx, dy + dh); ctx.lineTo(dx + cornerLen, dy + dh);
            // Bottom-right
            ctx.moveTo(dx + dw - cornerLen, dy + dh); ctx.lineTo(dx + dw, dy + dh); ctx.lineTo(dx + dw, dy + dh - cornerLen);
            ctx.stroke();

            // Draw label background
            const label = `${det.class} ${Math.round(det.score * 100)}%`;
            ctx.font = "bold 12px Inter, system-ui, sans-serif";
            const textMetrics = ctx.measureText(label);
            const labelH = 20;
            const labelW = textMetrics.width + 12;
            const labelX = dx;
            const labelY = dy > labelH + 4 ? dy - labelH - 2 : dy + 2;

            ctx.fillStyle = boxColor;
            ctx.beginPath();
            ctx.roundRect(labelX, labelY, labelW, labelH, 3);
            ctx.fill();

            // Draw label text
            ctx.fillStyle = "#ffffff";
            ctx.fillText(label, labelX + 6, labelY + 14);
        });

        // Pulsing scan line animation
        let animFrame: number;
        let scanY = 0;
        const animateScan = () => {
            scanY += 1.5;
            if (scanY > canvas.height) scanY = 0;
            // Only redraw the scan line part
            ctx.save();
            ctx.strokeStyle = boxColor + "40";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, scanY);
            ctx.lineTo(canvas.width, scanY);
            ctx.stroke();
            ctx.restore();
        };

        // Run a brief scan animation (2 seconds)
        const startTime = Date.now();
        const runAnimation = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 2000) {
                animateScan();
                animFrame = requestAnimationFrame(runAnimation);
            }
        };
        runAnimation();

        return () => {
            if (animFrame) cancelAnimationFrame(animFrame);
        };
    }, [imgLoaded, detections, category]);

    // Handle resize
    useEffect(() => {
        if (!imgLoaded) return;
        const handleResize = () => {
            // Trigger re-draw by toggling state
            setImgLoaded(false);
            setTimeout(() => setImgLoaded(true), 50);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [imgLoaded]);

    const severityLevel = severity ? getSeverityLevel(severity) : null;
    const sevColor = severityLevel ? SEVERITY_COLORS[severityLevel] : null;

    return (
        <div className="space-y-0">
            {/* Image + Overlay Container */}
            <div
                ref={containerRef}
                className={`relative ${aspectClass} bg-slate-100 rounded-t-sm border border-slate-200 overflow-hidden`}
            >
                {!imgError ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt={alt}
                            className="absolute inset-0 w-full h-full object-cover"
                            onLoad={() => setImgLoaded(true)}
                            onError={() => setImgError(true)}
                            crossOrigin="anonymous"
                        />
                        {/* Canvas overlay for detections */}
                        {detections.length > 0 && (
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                            />
                        )}
                        {/* Detection count badge */}
                        {detections.length > 0 && (
                            <div className="absolute top-2 left-2 z-20">
                                <Badge className="bg-black/70 backdrop-blur-sm text-white border-0 text-[10px] gap-1">
                                    <Scan className="w-3 h-3" />
                                    {detections.length} object{detections.length !== 1 ? "s" : ""} detected
                                </Badge>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm">Image could not be loaded</span>
                    </div>
                )}
            </div>

            {/* Legend Bar */}
            {showLegend && (severity !== undefined || confidence !== undefined || detections.length > 0) && (
                <div className="bg-slate-900 px-3 py-2 rounded-b-sm flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        {category && (
                            <Badge
                                className="text-[10px] uppercase tracking-wider font-bold border-0"
                                style={{ backgroundColor: CATEGORY_COLORS[category] || "#3b82f6", color: "#fff" }}
                            >
                                {category}
                            </Badge>
                        )}
                        {severityLevel && (
                            <Badge
                                className="text-[10px] uppercase tracking-wider font-bold border-0"
                                style={{ backgroundColor: sevColor || "#6b7280", color: "#fff" }}
                            >
                                {severityLevel} ({severity}/100)
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {confidence !== undefined && (
                            <span className="text-[10px] text-slate-400 font-medium">
                                AI Confidence: <span className="text-white font-bold">{confidence}%</span>
                            </span>
                        )}
                        {detections.length > 0 && (
                            <span className="text-[10px] text-slate-500">
                                {detections.map(d => d.class).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
