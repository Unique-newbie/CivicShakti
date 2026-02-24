"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, FileType2 } from "lucide-react";
import { toast } from "sonner";
import { databases, storage, appwriteConfig } from "@/lib/appwrite";
import { ID } from "appwrite";

interface Profile {
    $id?: string;
    user_id: string;
    trust_score: number;
    full_name?: string;
    phone_number?: string;
    address?: string;
    gov_id_url?: string;
    is_verified?: boolean;
}

interface ProfileEditModalProps {
    userId: string;
    profile: Profile | null;
    onUpdate: (updatedProfile: Profile) => void;
}

export function ProfileEditModal({ userId, profile, onUpdate }: ProfileEditModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || "");
    const [address, setAddress] = useState(profile?.address || "");
    const [govIdFile, setGovIdFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let govIdUrl = profile?.gov_id_url;

            // Upload new gov ID if selected
            if (govIdFile) {
                const fileUpload = await storage.createFile(
                    appwriteConfig.storageId,
                    ID.unique(),
                    govIdFile
                );
                govIdUrl = fileUpload.$id;
            }

            const profileData = {
                user_id: userId,
                full_name: fullName,
                phone_number: phoneNumber,
                address: address,
                ...(govIdUrl && { gov_id_url: govIdUrl }),
            };

            let updatedDoc;

            if (profile && profile.$id) {
                // Update existing profile
                updatedDoc = await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.profilesCollectionId,
                    profile.$id,
                    profileData
                );
            } else {
                // Create new profile mapped to user_id
                updatedDoc = await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.profilesCollectionId,
                    ID.unique(),
                    {
                        ...profileData,
                        trust_score: 50,
                        is_verified: false,
                    }
                );
            }

            toast.success("Profile saved successfully");
            onUpdate(updatedDoc as unknown as Profile);
            setIsOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to save profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Profile & Verification Details</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            placeholder="+91 9876543210"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Residential Address</Label>
                        <Textarea
                            id="address"
                            className="resize-none"
                            placeholder="Full address details..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Government ID Upload (For Verification)</Label>
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
                            <input
                                type="file"
                                id="govId"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                                disabled={isLoading}
                            />
                            <Label htmlFor="govId" className="cursor-pointer flex flex-col items-center gap-2">
                                {govIdFile ? (
                                    <>
                                        <FileType2 className="w-8 h-8 text-blue-500" />
                                        <span className="text-sm font-medium text-slate-700">{govIdFile.name}</span>
                                        <span className="text-xs text-slate-500">Click to change file</span>
                                    </>
                                ) : profile?.gov_id_url ? (
                                    <>
                                        <FileType2 className="w-8 h-8 text-emerald-500" />
                                        <span className="text-sm font-medium text-emerald-700">ID Already Uploaded</span>
                                        <span className="text-xs text-slate-500">Click to upload a new one to replace</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-8 h-8 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700">Select Image or PDF Document</span>
                                        <span className="text-xs text-slate-500">Aadhaar, Passport, or Driving License</span>
                                    </>
                                )}
                            </Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Details"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
