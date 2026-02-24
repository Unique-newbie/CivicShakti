"use client";

import { useEffect, useState } from "react";
import { Models, Query } from "appwrite";
import { databases, appwriteConfig, storage } from "@/lib/appwrite";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCircle, BadgeCheck, ShieldAlert, FileText, ExternalLink, Loader2 } from "lucide-react";

interface Profile extends Models.Document {
    user_id: string;
    trust_score: number;
    full_name?: string;
    phone_number?: string;
    address?: string;
    gov_id_url?: string;
    is_verified?: boolean;
}

export default function UsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const res = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.profilesCollectionId,
                [Query.orderDesc("$createdAt")]
            );
            setProfiles(res.documents as unknown as Profile[]);
        } catch (error) {
            console.error("Failed to fetch profiles", error);
            toast.error("Failed to load citizens.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyStatus = async (profileId: string, isVerified: boolean) => {
        setVerifyingId(profileId);
        try {
            const updated = await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.profilesCollectionId,
                profileId,
                { is_verified: isVerified }
            );

            setProfiles(prev => prev.map(p => p.$id === profileId ? (updated as unknown as Profile) : p));
            toast.success(`Profile marked as ${isVerified ? "verified" : "unverified"}.`);
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update verification status.");
        } finally {
            setVerifyingId(null);
        }
    };

    const getFileUrl = (fileId: string) => {
        return storage.getFileView(appwriteConfig.storageId, fileId).toString();
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading citizens...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Citizens & Verification</h1>
                    <p className="text-slate-500">Review citizen profiles and government IDs.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Citizen Profiles ({profiles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Citizen</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {profiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                            No profiles found.
                                        </td>
                                    </tr>
                                ) : (
                                    profiles.map((profile) => (
                                        <tr key={profile.$id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                        <UserCircle className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{profile.full_name || "Unknown Name"}</p>
                                                        <p className="text-xs text-slate-500">Trust Score: {profile.trust_score}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <div className="space-y-1 text-xs">
                                                    <p>{profile.phone_number || "No phone"}</p>
                                                    <p className="max-w-[150px] truncate" title={profile.address}>{profile.address || "No address"}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {profile.is_verified ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                                        <BadgeCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Verified
                                                    </Badge>
                                                ) : profile.gov_id_url ? (
                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                                                        <FileText className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pending Review
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100">
                                                        Unverified
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                {profile.gov_id_url && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <button className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1.5 rounded border border-blue-200">
                                                                Review ID
                                                            </button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[600px]">
                                                            <DialogHeader>
                                                                <DialogTitle>Government ID Review</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-100">
                                                                    <div>
                                                                        <p className="font-bold text-slate-900">{profile.full_name}</p>
                                                                        <p className="text-sm text-slate-500">{profile.address}</p>
                                                                    </div>
                                                                    <Badge className={profile.is_verified ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}>
                                                                        {profile.is_verified ? "Verified" : "Pending"}
                                                                    </Badge>
                                                                </div>

                                                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center min-h-[300px]">
                                                                    {/* Simple embedded iframe for images/pdfs */}
                                                                    <iframe
                                                                        src={getFileUrl(profile.gov_id_url)}
                                                                        className="w-full h-[400px]"
                                                                        title="Government ID"
                                                                    />
                                                                </div>

                                                                <div className="flex justify-between items-center pt-4">
                                                                    <a
                                                                        href={getFileUrl(profile.gov_id_url)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-sm text-blue-600 flex items-center hover:underline"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4 mr-1" /> Open in new tab
                                                                    </a>
                                                                    <div className="space-x-2">
                                                                        {!profile.is_verified ? (
                                                                            <button
                                                                                disabled={verifyingId === profile.$id}
                                                                                onClick={() => handleVerifyStatus(profile.$id, true)}
                                                                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                                                                            >
                                                                                {verifyingId === profile.$id ? "Updating..." : "Approve & Verify"}
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                disabled={verifyingId === profile.$id}
                                                                                onClick={() => handleVerifyStatus(profile.$id, false)}
                                                                                className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                                                                            >
                                                                                {verifyingId === profile.$id ? "Updating..." : "Revoke Verification"}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}

                                                {/* Without ID, can still manually verify maybe? Not MVP. */}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
