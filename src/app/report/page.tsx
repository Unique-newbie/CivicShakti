"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

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

// Supabase would be imported here for actual submission
import { databases, storage, appwriteConfig, account } from "@/lib/appwrite";
import { ID, Models } from "appwrite";
import { toast } from "sonner";
import { getAuthJWT } from "@/lib/auth-helpers";

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
    // User State
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);

    // Photo upload handling
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    // AI Detection State
    const [isDetecting, setIsDetecting] = useState(false);

    // Initial Auth Check
    useEffect(() => {
        account.get().then((res) => {
            setUser(res);
        }).catch(() => {
            router.push('/login');
        });
    }, [router]);

    const handleNext = () => setStep((s) => Math.min(s + 1, 4));
    const handleBack = () => setStep((s) => Math.max(s - 1, 1));

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const url = URL.createObjectURL(file);
            setPhotoPreview(url);
        }
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

            // 1. Upload Image to Storage Bucket (if exists)
            if (photoFile) {
                const uploadedFile = await storage.createFile(
                    appwriteConfig.storageId,
                    ID.unique(),
                    photoFile
                );

                // Construct public image URL to save to DB
                // Format: [endpoint]/storage/buckets/[bucketId]/files/[fileId]/view?project=[projectId]
                imageUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;
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
                citizen_contact: user?.$id || "anonymous",
                lat,
                lng,
                image_url: imageUrl,
                device_fingerprint: deviceFingerprint
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

                        {/* STEP 2: LOCATION */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <MapPicker onLocationSelect={(newLat, newLng, addr) => { setLat(newLat); setLng(newLng); if (addr) setAddress(addr); }} />

                                {lat && lng && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="address">Selected Address (Editable)</Label>
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
                                    <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-sm cursor-pointer transition-colors ${photoPreview ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}`}>
                                        {photoPreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover rounded-sm" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                                                <Camera className="w-10 h-10 mb-3 text-slate-400" />
                                                <p className="mb-2 text-sm font-semibold">{t("report.take_photo")}</p>
                                                <p className="text-xs">{t("report.drag_drop")}</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                    </label>
                                </div>

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
                                disabled={(step === 1 && !category) || (step === 3 && !description)}
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
