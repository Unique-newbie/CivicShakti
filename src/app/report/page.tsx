"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { AddressDetails } from "@/components/MapPicker";

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
import {
    Building2,
    MapPin,
    Camera,
    AlertTriangle,
    Ban,
    Droplets,
    Zap,
    Wind,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Loader2,
    ShieldAlert,
    ArrowLeft
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// JWT-based auth
import { toast } from "sonner";
import { getAuthJWT } from "@/lib/auth-helpers";
import { loadModels, analyzeFromBase64, isModelReady, isModelLoading, type CivicAnalysis } from "@/lib/civic-ai-model";

const CATEGORIES = [
    { id: "pothole", label: "Pothole", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-100" },
    { id: "garbage", label: "Garbage", icon: Ban, color: "text-emerald-500", bg: "bg-emerald-100" },
    { id: "water", label: "Water Leak", icon: Droplets, color: "text-blue-500", bg: "bg-blue-100" },
    { id: "electricity", label: "Streetlight", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
    { id: "pollution", label: "Pollution", icon: Wind, color: "text-slate-500", bg: "bg-slate-100" },
    { id: "infrastructure", label: "Other", icon: Building2, color: "text-indigo-500", bg: "bg-indigo-100" },
];

export default function ReportClient() {
    const router = useRouter();
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);

    // Auto-resolved location from map (Nominatim reverse geocoding)
    const [locationDetails, setLocationDetails] = useState<AddressDetails | null>(null);

    // User State
    const [user, setUser] = useState<any | null>(null);
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    // Photo upload handling
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    // Camera capture state
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // AI Vision Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [isTfRunning, setIsTfRunning] = useState(false);
    const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    // AI Detection State
    const [isDetecting, setIsDetecting] = useState(false);

    // Initial Auth & Device Check
    useEffect(() => {
        // Enhanced Mobile Check — user agent + media query + touch detection
        const checkMobile = () => {
            // Allow desktop override for testing: ?desktop=true
            const params = new URLSearchParams(window.location.search);
            if (params.get('desktop') === 'true') {
                setIsMobile(true);
                return;
            }

            const userAgent = navigator.userAgent;
            const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            const narrowScreen = window.matchMedia('(max-width: 768px)').matches;
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            setIsMobile(mobileUA || (narrowScreen && hasTouch));
        };
        checkMobile();

        // Pre-load TensorFlow.js models (COCO-SSD + MobileNet V2)
        loadModels()
            .then(() => setModelStatus('ready'))
            .catch(() => setModelStatus('error'));

        getAuthJWT().then(async (token) => {
            if (!token) { router.push('/login'); return; }
            try {
                const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) { router.push('/login'); return; }
                setUser(await res.json());
            } catch { router.push('/login'); }
        });
    }, [router]);

    // No more manual location fetching — MapPicker auto-resolves via Nominatim

    const handleNext = () => setStep((s) => Math.min(s + 1, 4));
    const handleBack = () => setStep((s) => Math.max(s - 1, 1));

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const url = URL.createObjectURL(file);
            setPhotoPreview(url);
            stopCamera();
            triggerAIAnalysis(file);
        }
    };

    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            setCameraStream(stream);
            setIsCameraOpen(true);
            // wait for the video element to mount
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.error);
                }
            }, 100);
        } catch (err: any) {
            console.error('Camera access denied:', err);
            toast.error('Camera access denied. Please allow camera permissions or use file upload.');
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                setPhotoFile(file);
                setPhotoPreview(URL.createObjectURL(file));
                stopCamera();
                toast.success('Photo captured!');
                triggerAIAnalysis(file);
            }
        }, 'image/jpeg', 0.85);
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            setCameraStream(null);
        }
        setIsCameraOpen(false);
    };

    const clearPhoto = () => {
        setPhotoPreview(null);
        setPhotoFile(null);
        setAiAnalysis(null);
        stopCamera();
    };

    /**
     * CivicShakti AI Pipeline:
     * PRIMARY: TensorFlow.js model (COCO-SSD + MobileNet + Color + Texture)
     * FALLBACK: Gemini Vision API (only if TF.js confidence < 30%)
     */
    const triggerAIAnalysis = async (file: File) => {
        setIsAnalyzing(true);
        setIsTfRunning(true);
        setAiAnalysis(null);

        // Convert to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });

        // --- PRIMARY: CivicShakti AI Model (runs in browser) ---
        let tfResult: CivicAnalysis | null = null;
        try {
            tfResult = await analyzeFromBase64(base64);
            setAiAnalysis(tfResult);

            // Auto-fill category
            const detectedCat = tfResult.detected_issue?.category;
            if (detectedCat && CATEGORIES.some(c => c.id === detectedCat)) {
                setCategory(detectedCat);
            }

            // Auto-fill description if empty
            if (!description && tfResult.detected_issue?.description) {
                setDescription(tfResult.detected_issue.description);
            }

            const confidence = tfResult.quality?.confidence || 0;
            if (confidence >= 50) {
                toast.success(`⚡ CivicShakti AI: ${tfResult.detected_issue?.sub_type} (${confidence}% confident)`);
            } else if (confidence >= 30) {
                toast.info(`⚡ CivicShakti AI: ${tfResult.detected_issue?.sub_type} (${confidence}% — moderate confidence)`);
            }
        } catch (err) {
            console.warn('[CivicAI] Primary analysis failed:', err);
        } finally {
            setIsTfRunning(false);
        }

        // --- FALLBACK: Gemini Vision API (only if TF.js confidence is low) ---
        const needsFallback = !tfResult || (tfResult.quality?.confidence || 0) < 30;
        if (needsFallback) {
            try {
                toast.info('🧠 Low confidence — calling Gemini Vision as backup...', { duration: 3000 });
                const res = await fetch('/api/ai/analyze-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        base64Image: base64,
                        mimeType: file.type || 'image/jpeg',
                        description: description || undefined,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.analysis) {
                        // Gemini overrides only when TF.js was low confidence
                        setAiAnalysis(data.analysis);
                        const detectedCat = data.analysis.detected_issue?.category;
                        if (detectedCat && CATEGORIES.some(c => c.id === detectedCat)) {
                            setCategory(detectedCat);
                        }
                        if (!description && data.analysis.detected_issue?.description) {
                            setDescription(data.analysis.detected_issue.description);
                        }
                        toast.success(`🧠 Gemini fallback: ${data.analysis.detected_issue?.sub_type}`);
                    }
                }
            } catch (error) {
                console.warn('[Gemini] Fallback failed:', error);
                if (!tfResult) {
                    toast.error('Both AI models failed. Please describe the issue manually.');
                }
            }
        }

        setIsAnalyzing(false);
    };

    const handleAutoDetect = async () => {
        if (!description.trim()) return;
        setIsDetecting(true);
        try {
            const res = await fetch('/api/ai/categorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });

            if (!res.ok) throw new Error("Failed to detect category");

            const data = await res.json();
            if (data.category && CATEGORIES.some(c => c.id === data.category)) {
                setCategory(data.category);
                toast.success(`Category auto-detected: ${CATEGORIES.find(c => c.id === data.category)?.label}`);
            } else {
                toast.error("Could not confidently determine a category.");
            }
        } catch (error) {
            console.error(error);
            toast.error("AI detection failed. Please select manually.");
        } finally {
            setIsDetecting(false);
        }
    };

    const handleSubmit = async () => {
        if (!category) return;
        setIsSubmitting(true);

        try {
            let imageUrl = null;

            // 1. Convert image to base64 data URL (no separate storage needed)
            if (photoFile) {
                const reader = new FileReader();
                imageUrl = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(photoFile);
                });
            }

            // 2. Get Device Fingerprint
            const fpPromise = import('@fingerprintjs/fingerprintjs');
            const fp = await (await fpPromise).load();
            const result = await fp.get();
            const deviceFingerprint = result.visitorId;

            // 3. Send Payload to Secure API Route
            const payload = {
                category,
                description,
                address: address || "Location Pending",
                citizen_contact: user?.id || user?.$id || "anonymous",
                lat,
                lng,
                image_url: imageUrl,
                device_fingerprint: deviceFingerprint,
                state_id: locationDetails?.state || null,
                city_id: locationDetails?.city || null,
                village_id: locationDetails?.village || locationDetails?.suburb || null,
                ward_id: locationDetails?.district || null,
            };

            // Get JWT for server-side auth
            const jwt = await getAuthJWT();

            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit to server");
            }

            const data = await response.json();

            toast.success(t("report.success"));
            router.push(`/track/${data.tracking_id}`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || t("report.error"));
            setIsSubmitting(false);
        }
    };

    if (isMobile === null) return null; // Loading

    if (isMobile === false) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
                        <Ban className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Mobile Only</h2>
                    <p className="text-slate-600 mb-8">
                        For security and accuracy, civic complaints can only be submitted from a mobile device app or mobile browser. Please visit this link on your phone.
                    </p>
                    <BackButton fallbackHref="/" label="Return to Home" />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                {/* Header Actions */}
                <div className="mb-6 flex justify-between items-center">
                    <BackButton fallbackHref="/dashboard" label="Cancel & Return" />
                </div>

                {/* Progress Bar */}
                <div className="mb-8 relative">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600">{t("report.step1")}</span>
                        <span className={`text-xs font-medium ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>{t("report.loc")}</span>
                        <span className={`text-xs font-medium ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>{t("report.step2")}</span>
                        <span className={`text-xs font-medium ${step >= 4 ? 'text-blue-600' : 'text-slate-400'}`}>{t("report.step3")}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        />
                    </div>
                </div>

                <Card className="rounded-sm border-slate-300 shadow-none">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">
                            {step === 1 && t("report.header1")}
                            {step === 2 && t("report.header2")}
                            {step === 3 && t("report.header3")}
                            {step === 4 && t("report.header4")}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && t("report.desc1")}
                            {step === 2 && t("report.desc2")}
                            {step === 3 && t("report.desc3")}
                            {step === 4 && t("report.desc4")}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* STEP 1: CATEGORY */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {CATEGORIES.map((cat) => {
                                        const Icon = cat.icon;
                                        const isSelected = category === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCategory(cat.id)}
                                                className={`flex flex-col items-center justify-center p-6 rounded-sm border-2 transition-all ${isSelected
                                                    ? 'border-blue-600 bg-blue-50/50 scale-105 shadow-none'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-sm ${cat.bg} ${cat.color} flex items-center justify-center mb-3`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <span className="font-medium text-slate-700">{t(`category.${cat.id}`)}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 rounded-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-600 text-white p-1.5 rounded-sm">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-medium text-slate-900">Not sure which category?</h3>
                                        </div>
                                        <p className="text-sm text-slate-600">Describe the issue briefly and our AI will select the right category for you.</p>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="e.g., There is a huge crater in the road..."
                                                className="bg-white border-blue-200 focus-visible:ring-blue-500"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAutoDetect();
                                                    }
                                                }}
                                            />
                                            <Button
                                                onClick={handleAutoDetect}
                                                disabled={isDetecting || !description.trim()}
                                                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                            >
                                                {isDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Auto-Detect"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: LOCATION — Auto-resolved from map */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <MapPicker onLocationSelect={(newLat, newLng, addr, details) => {
                                    setLat(newLat);
                                    setLng(newLng);
                                    if (addr) setAddress(addr);
                                    if (details) setLocationDetails(details);
                                }} />

                                {/* Auto-resolved location chips */}
                                {locationDetails && (locationDetails.state || locationDetails.city) && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 animate-in fade-in slide-in-from-top-2 space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin className="w-4 h-4 text-emerald-600" />
                                            <span className="text-sm font-semibold text-emerald-900">Location auto-detected</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {locationDetails.state && (
                                                <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-800 text-xs">
                                                    🏛️ {locationDetails.state}
                                                </Badge>
                                            )}
                                            {locationDetails.city && (
                                                <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-800 text-xs">
                                                    🏙️ {locationDetails.city}
                                                </Badge>
                                            )}
                                            {locationDetails.district && (
                                                <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-800 text-xs">
                                                    📍 {locationDetails.district}
                                                </Badge>
                                            )}
                                            {(locationDetails.village || locationDetails.suburb) && (
                                                <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-800 text-xs">
                                                    🏘️ {locationDetails.village || locationDetails.suburb}
                                                </Badge>
                                            )}
                                            {locationDetails.postcode && (
                                                <Badge variant="outline" className="bg-white border-slate-300 text-slate-700 text-xs">
                                                    📮 {locationDetails.postcode}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {lat && lng && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="address">Selected Address (Editable) <span className="text-rose-500">*</span></Label>
                                        <Input
                                            id="address"
                                            placeholder="Provide exact building numbers, flat details, or nearby landmarks..."
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className="h-12 text-sm bg-white"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 3: DETAILS & PHOTO */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">{t("report.visual_proof")} <span className="text-slate-400 text-xs italic font-normal ml-2">{t("report.visual_proof_opt")}</span></Label>

                                    {/* Camera / Photo Preview Area */}
                                    {isCameraOpen ? (
                                        <div className="relative rounded-sm overflow-hidden border-2 border-blue-400 bg-black">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-64 object-cover"
                                            />
                                            <canvas ref={canvasRef} className="hidden" />
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex items-center justify-center gap-4">
                                                <Button
                                                    onClick={capturePhoto}
                                                    className="bg-white text-black hover:bg-white/90 rounded-full w-16 h-16 shadow-xl border-4 border-white/50"
                                                    size="icon"
                                                >
                                                    <Camera className="w-7 h-7" />
                                                </Button>
                                                <Button
                                                    onClick={stopCamera}
                                                    variant="ghost"
                                                    className="text-white hover:bg-white/20"
                                                    size="sm"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : photoPreview ? (
                                        <div className="relative rounded-sm overflow-hidden border-2 border-emerald-400 bg-slate-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={photoPreview} alt="Preview" className="w-full h-64 object-cover" />
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <Button
                                                    onClick={clearPhoto}
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-white/90 backdrop-blur-sm text-rose-600 border-rose-200 hover:bg-rose-50 shadow-md"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                            <div className="absolute bottom-2 left-2">
                                                <Badge className="bg-emerald-500 text-white border-0 shadow-md">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Photo Ready
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Camera Capture Button */}
                                            <button
                                                type="button"
                                                onClick={openCamera}
                                                className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-sm cursor-pointer transition-all border-blue-300 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-400 group"
                                            >
                                                <div className="p-3 bg-blue-100 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
                                                    <Camera className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <p className="text-sm font-semibold text-blue-700">Take Photo</p>
                                                <p className="text-xs text-blue-500 mt-1">Use device camera</p>
                                            </button>

                                            {/* File Upload Button */}
                                            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-sm cursor-pointer transition-all border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 group">
                                                <div className="p-3 bg-slate-200 rounded-full mb-3 group-hover:bg-slate-300 transition-colors">
                                                    <ArrowLeft className="w-8 h-8 text-slate-600 rotate-90" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700">Upload File</p>
                                                <p className="text-xs text-slate-500 mt-1">From gallery</p>
                                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* CivicShakti AI Analysis Status */}
                                {(isAnalyzing || isTfRunning) && (
                                    <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-sm p-4 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                                            <div>
                                                <p className="font-semibold text-violet-900 text-sm">CivicShakti AI Engine</p>
                                                <p className="text-xs text-violet-600">
                                                    {isTfRunning
                                                        ? '⚡ Analyzing with TensorFlow.js (Object Detection + MobileNet + Color + Texture)...'
                                                        : '🧠 Low confidence — calling Gemini Vision fallback...'}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Analysis stages */}
                                        <div className="flex items-center gap-1.5 text-[10px] pl-8 flex-wrap">
                                            {['Objects', 'MobileNet', 'Colors', 'Texture'].map((stage, i) => (
                                                <span key={i} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                                                    aiAnalysis ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-600'
                                                }`}>
                                                    {aiAnalysis ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                                    {stage}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {aiAnalysis && !isAnalyzing && !isTfRunning && (
                                    <div className="bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/30 border border-violet-200 rounded-sm overflow-hidden">
                                        <div className="bg-gradient-to-r from-violet-700 to-blue-700 px-4 py-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-white" />
                                                <span className="text-white font-semibold text-sm">AI Analysis Result</span>
                                                <Badge className="bg-white/20 text-white border-0 text-[9px]">
                                                    {aiAnalysis.model_source === 'civicshakti-ai' ? '⚡ CivicShakti AI' : '🧠 Gemini Fallback'}
                                                </Badge>
                                            </div>
                                            <Badge className={`border-0 text-white text-[10px] font-bold ${
                                                aiAnalysis.quality?.confidence >= 70 ? 'bg-emerald-500' :
                                                aiAnalysis.quality?.confidence >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}>
                                                {aiAnalysis.quality?.confidence || 0}% Confidence
                                            </Badge>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {/* Severity + Category Row */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Badge className={`text-xs px-2.5 py-1 border-0 font-bold uppercase tracking-wider ${
                                                    aiAnalysis.severity?.level === 'critical' ? 'bg-red-600 text-white' :
                                                    aiAnalysis.severity?.level === 'high' ? 'bg-orange-500 text-white' :
                                                    aiAnalysis.severity?.level === 'medium' ? 'bg-amber-500 text-white' :
                                                    'bg-emerald-500 text-white'
                                                }`}>
                                                    {aiAnalysis.severity?.level} ({aiAnalysis.severity?.score}/100)
                                                </Badge>
                                                <span className="text-sm font-semibold text-slate-800 capitalize">
                                                    {aiAnalysis.detected_issue?.sub_type || aiAnalysis.detected_issue?.category}
                                                </span>
                                                {aiAnalysis.severity?.safety_hazard && (
                                                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] animate-pulse">
                                                        ⚠️ Safety Hazard
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Department Routing */}
                                            <div className="bg-white/70 rounded p-2.5 border border-slate-200/50">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Routing to</p>
                                                <p className="text-sm font-medium text-slate-800">
                                                    {aiAnalysis.department?.primary} → {aiAnalysis.department?.secondary}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Escalation: <span className={`font-semibold ${
                                                        aiAnalysis.department?.escalation === 'emergency' ? 'text-red-600' :
                                                        aiAnalysis.department?.escalation === 'urgent' ? 'text-amber-600' : 'text-slate-600'
                                                    }`}>{aiAnalysis.department?.escalation}</span>
                                                    {aiAnalysis.severity?.estimated_affected && (
                                                        <span className="ml-2">• Affects: {aiAnalysis.severity.estimated_affected}</span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Detected Objects */}
                                            {aiAnalysis.detected_issue?.objects_detected?.length > 0 && (
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Detected:</span>
                                                    {aiAnalysis.detected_issue.objects_detected.map((obj: string, i: number) => (
                                                        <span key={i} className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                                            {obj}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* AI Suggestions */}
                                            {aiAnalysis.quality?.suggestions && (
                                                <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded border border-blue-100 italic">
                                                    💡 {aiAnalysis.quality.suggestions}
                                                </p>
                                            )}

                                            {/* Not relevant warning */}
                                            {!aiAnalysis.quality?.image_relevant && (
                                                <div className="bg-rose-50 border border-rose-200 px-3 py-2 rounded flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                                    <p className="text-xs text-rose-700 font-medium">
                                                        This image may not show a civic issue. Please upload a relevant photo.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Model Internals (only for CivicShakti AI) */}
                                            {aiAnalysis.model_source === 'civicshakti-ai' && aiAnalysis.analysis_details && (
                                                <details className="text-xs">
                                                    <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium py-1">
                                                        📊 Model Analysis Details
                                                    </summary>
                                                    <div className="mt-2 space-y-2 bg-white/60 rounded p-2.5 border border-slate-100">
                                                        {/* MobileNet top predictions */}
                                                        {aiAnalysis.analysis_details.mobilenet_classes?.length > 0 && (
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">MobileNet V2 Top Classes</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {aiAnalysis.analysis_details.mobilenet_classes.slice(0, 6).map((cls: any, i: number) => (
                                                                        <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                                                            {cls.className} ({(cls.probability * 100).toFixed(1)}%)
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Color Profile */}
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Color Signals</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {aiAnalysis.analysis_details.color_profile?.dominant_colors?.map((c: any, i: number) => (
                                                                        <span key={i} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                                                            {c.name} {c.percentage}%
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Texture Metrics</p>
                                                                <div className="text-[10px] text-slate-600 space-y-0.5">
                                                                    <p>Edge density: {(aiAnalysis.analysis_details.texture_profile?.edge_density * 100).toFixed(0)}%</p>
                                                                    <p>Roughness: {(aiAnalysis.analysis_details.texture_profile?.roughness * 100).toFixed(0)}%</p>
                                                                    <p>Uniformity: {(aiAnalysis.analysis_details.texture_profile?.uniformity * 100).toFixed(0)}%</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Signal scores */}
                                                        {aiAnalysis.analysis_details.signal_scores && (
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Category Scores</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Object.entries(aiAnalysis.analysis_details.signal_scores)
                                                                        .sort((a: any, b: any) => b[1] - a[1])
                                                                        .map(([cat, score]: any, i: number) => (
                                                                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${i === 0 ? 'bg-violet-100 text-violet-800 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                                                                            {cat}: {score}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="desc" className="flex items-center gap-1">{t("report.additional_desc")} <span className="text-rose-500">*</span></Label>
                                    <Textarea
                                        id="desc"
                                        placeholder={t("report.desc_placeholder_detail")}
                                        className="min-h-[120px]"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 4: REVIEW */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-slate-50 rounded-sm p-6 space-y-4 border border-slate-200">
                                    <div className="flex justify-between pb-4 border-b border-slate-200">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Category</p>
                                            <p className="font-semibold text-slate-900 text-lg capitalize">{category || "Not selected"}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-blue-600 h-8 px-2">Edit</Button>
                                    </div>

                                    <div className="flex justify-between pb-4 border-b border-slate-200">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Location</p>
                                            <p className="font-semibold text-slate-900">{address || "Map pin"}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-blue-600 h-8 px-2">Edit</Button>
                                    </div>

                                    <div className="flex justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Details</p>
                                            <p className="text-slate-700 mt-1">{description || "No description provided."}</p>
                                            {photoPreview && <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Photo attached</p>}
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="text-blue-600 h-8 px-2">Edit</Button>
                                    </div>

                                    {/* AI Analysis Summary */}
                                    {aiAnalysis && (
                                        <div className="pt-4 border-t border-slate-200 space-y-2">
                                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase flex items-center gap-1.5">
                                                <ShieldAlert className="w-3.5 h-3.5" /> AI Analysis
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-xs text-slate-400">Detected Issue</p>
                                                    <p className="font-medium text-slate-800 capitalize">{aiAnalysis.detected_issue?.sub_type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400">Severity</p>
                                                    <p className="font-medium capitalize">
                                                        <span className={`${
                                                            aiAnalysis.severity?.level === 'critical' ? 'text-red-600' :
                                                            aiAnalysis.severity?.level === 'high' ? 'text-orange-600' :
                                                            aiAnalysis.severity?.level === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                                                        }`}>{aiAnalysis.severity?.level}</span> ({aiAnalysis.severity?.score}/100)
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400">Department</p>
                                                    <p className="font-medium text-slate-800">{aiAnalysis.department?.primary}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400">AI Confidence</p>
                                                    <p className="font-medium text-slate-800">{aiAnalysis.quality?.confidence}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-blue-600" />
                                        Authenticated Assigner
                                    </h4>
                                    <p className="text-sm text-slate-500 leading-relaxed -mt-2">
                                        This report will be tied to your verified account ({user?.email}).
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between border-t border-slate-100 pt-6">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={step === 1 || isSubmitting}
                            className="px-6 rounded-sm shadow-none hover:bg-slate-50"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>

                        {step < 4 ? (
                            <Button
                                onClick={handleNext}
                                disabled={
                                    (step === 1 && !category) ||
                                    (step === 2 && (!lat || !address)) ||
                                    (step === 3 && !description)
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-sm shadow-none"
                            >
                                Next Step <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-sm shadow-none"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit Report</>
                                )}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div >
        </div >
    );
}
