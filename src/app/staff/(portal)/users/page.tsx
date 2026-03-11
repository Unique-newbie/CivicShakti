"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCircle, BadgeCheck, ShieldAlert, FileText, Loader2, MapPin } from "lucide-react";
import { getAuthJWT } from "@/lib/auth-helpers";

interface Profile {
    id: string;
    userId: string;
    user_id?: string;
    trustScore: number;
    fullName?: string;
    full_name?: string;
    phoneNumber?: string;
    phone_number?: string;
    address?: string;
    govIdUrl?: string;
    gov_id_url?: string;
    isVerified?: boolean;
    is_verified?: boolean;
    adminLevel?: string;
    admin_level?: string;
    stateId?: string;
    state_id?: string;
    cityId?: string;
    city_id?: string;
    villageId?: string;
    village_id?: string;
    wardId?: string;
    ward_id?: string;
    user?: { id: string; email: string; name?: string };
    $id?: string;
}

// Normalize Appwrite snake_case to camelCase for display
function normalize(p: any): Profile {
    return {
        id: p.$id || p.id,
        userId: p.user_id || p.userId,
        trustScore: p.trust_score ?? p.trustScore ?? 0,
        fullName: p.full_name || p.fullName,
        phoneNumber: p.phone_number || p.phoneNumber,
        address: p.address,
        govIdUrl: p.gov_id_url || p.govIdUrl,
        isVerified: p.is_verified ?? p.isVerified ?? false,
        adminLevel: p.admin_level || p.adminLevel || 'none',
        stateId: p.state_id || p.stateId,
        cityId: p.city_id || p.cityId,
        villageId: p.village_id || p.villageId,
        wardId: p.ward_id || p.wardId,
        user: p.user,
    };
}

// Role hierarchy for gating which roles a caller can assign
const ROLE_HIERARCHY: Record<string, number> = {
    superadmin: 5,
    state: 4,
    city: 3,
    village: 2,
    ward: 1,
    citizen: 0,
    none: 0,
};

const ROLE_LABELS: Record<string, string> = {
    none: 'Citizen (No Access)',
    ward: 'Ward Admin',
    village: 'Village / Town Admin',
    city: 'City / District Admin',
    state: 'State Admin',
    superadmin: 'Super Admin (Global)',
};

export default function UsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    // Caller info
    const [callerProfile, setCallerProfile] = useState<Profile | null>(null);
    const callerRank = ROLE_HIERARCHY[callerProfile?.adminLevel || 'none'] ?? 0;

    // Role Management Modal
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isSavingRole, setIsSavingRole] = useState(false);
    
    // Form state
    const [adminLevel, setAdminLevel] = useState('none');
    const [jurisdictionState, setJurisdictionState] = useState('');
    const [jurisdictionCity, setJurisdictionCity] = useState('');
    const [jurisdictionVillage, setJurisdictionVillage] = useState('');
    const [jurisdictionWard, setJurisdictionWard] = useState('');

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const token = await getAuthJWT();

            // Get current user info for caller role check
            const meRes = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const meData = await meRes.json();
            const myUserId = meData.$id || meData.id;

            // Fetch all profiles
            const res = await fetch('/api/staff/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch profiles");
            const data = await res.json();
            const normalized = data.map(normalize);
            setProfiles(normalized);

            // Find caller's own profile to know their role
            const me = normalized.find((p: Profile) => p.userId === myUserId);
            if (me) {
                if (meData.labels?.includes('superadmin')) {
                    me.adminLevel = 'superadmin';
                }
                setCallerProfile(me);
            }
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
            const token = await getAuthJWT();
            const res = await fetch('/api/staff/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ profileId, isVerified }),
            });

            if (!res.ok) throw new Error("Failed to update verification");
            await res.json();

            setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, isVerified } : p));
            toast.success(`Profile marked as ${isVerified ? "verified" : "unverified"}.`);
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update verification status.");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleOpenRoleModal = (profile: Profile) => {
        setSelectedProfile(profile);
        setAdminLevel(profile.adminLevel || 'none');
        setJurisdictionState(profile.stateId || '');
        setJurisdictionCity(profile.cityId || '');
        setJurisdictionVillage(profile.villageId || '');
        setJurisdictionWard(profile.wardId || '');
        setIsRoleModalOpen(true);
    };

    // Get assignable roles — only roles below the caller's rank
    const getAssignableRoles = (): string[] => {
        const allRoles = ['none', 'ward', 'village', 'city', 'state', 'superadmin'];
        return allRoles.filter(role => ROLE_HIERARCHY[role] < callerRank);
    };

    const handleSaveRole = async () => {
        if (!selectedProfile) return;
        setIsSavingRole(true);

        try {
            const token = await getAuthJWT();
            
            const payload: any = {
                profileId: selectedProfile.id,
                userId: selectedProfile.userId,
                adminLevel,
                stateId: null,
                cityId: null,
                villageId: null,
                wardId: null,
            };

            // Fill the jurisdiction based on role level
            if (adminLevel === 'state') {
                payload.stateId = jurisdictionState;
            } else if (adminLevel === 'city') {
                payload.stateId = jurisdictionState;
                payload.cityId = jurisdictionCity;
            } else if (adminLevel === 'village') {
                payload.stateId = jurisdictionState;
                payload.cityId = jurisdictionCity;
                payload.villageId = jurisdictionVillage;
            } else if (adminLevel === 'ward') {
                payload.stateId = jurisdictionState;
                payload.cityId = jurisdictionCity;
                payload.villageId = jurisdictionVillage;
                payload.wardId = jurisdictionWard;
            }

            // For non-superadmin callers, auto-inherit their own jurisdiction
            if (callerProfile && callerProfile.adminLevel !== 'superadmin') {
                if (callerProfile.stateId) payload.stateId = payload.stateId || callerProfile.stateId;
                if (callerProfile.cityId) payload.cityId = payload.cityId || callerProfile.cityId;
                if (callerProfile.villageId) payload.villageId = payload.villageId || callerProfile.villageId;
            }

            const res = await fetch('/api/staff/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to save role");
            }

            // Update local state
            setProfiles(prev => prev.map(p => p.id === selectedProfile.id ? {
                ...p,
                adminLevel,
                stateId: payload.stateId || undefined,
                cityId: payload.cityId || undefined,
                villageId: payload.villageId || undefined,
                wardId: payload.wardId || undefined,
            } : p));

            toast.success("Role and jurisdiction updated successfully.");
            setIsRoleModalOpen(false);
        } catch (error: any) {
            console.error("Failed to update role", error);
            toast.error(error.message || "Failed to update user role.");
        } finally {
            setIsSavingRole(false);
        }
    };

    // Check if Save button should be disabled
    const isSaveDisabled = () => {
        if (isSavingRole) return true;
        if (adminLevel === 'none' || adminLevel === 'citizen' || adminLevel === 'superadmin') return false;
        // For location-based roles, the relevant jurisdiction field must be filled
        if (adminLevel === 'state' && !jurisdictionState.trim()) return true;
        if (adminLevel === 'city' && (!jurisdictionCity.trim())) return true;
        if (adminLevel === 'village' && (!jurisdictionVillage.trim())) return true;
        if (adminLevel === 'ward' && (!jurisdictionWard.trim())) return true;
        return false;
    };

    // Build a readable jurisdiction string for display
    const getJurisdictionDisplay = (p: Profile): string => {
        const parts = [];
        if (p.wardId) parts.push(`Ward: ${p.wardId}`);
        if (p.villageId) parts.push(`Village: ${p.villageId}`);
        if (p.cityId) parts.push(`City: ${p.cityId}`);
        if (p.stateId) parts.push(`State: ${p.stateId}`);
        return parts.join(' • ') || '';
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

    const assignableRoles = getAssignableRoles();
    const canManageRoles = callerRank >= 2; // At least village admin

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Citizens & Verification</h1>
                    <p className="text-slate-500">Review citizen profiles and manage staff roles.</p>
                </div>
                {callerProfile && (
                    <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                        Your Role: {ROLE_LABELS[callerProfile.adminLevel || 'none']}
                    </Badge>
                )}
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
                                    <th className="px-4 py-3">Status & Role</th>
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
                                        <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                        <UserCircle className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{profile.fullName || profile.user?.name || "Unknown Name"}</p>
                                                        <p className="text-xs text-slate-500">Trust Score: {profile.trustScore}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <div className="space-y-1 text-xs">
                                                    <p>{profile.phoneNumber || "No phone"}</p>
                                                    <p className="max-w-[150px] truncate" title={profile.address}>{profile.address || "No address"}</p>
                                                    <p className="text-slate-400">{profile.user?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {profile.isVerified ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                                        <BadgeCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Verified
                                                    </Badge>
                                                ) : profile.govIdUrl ? (
                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                                                        <FileText className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pending Review
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100">
                                                        Unverified
                                                    </Badge>
                                                )}
                                                {profile.adminLevel && profile.adminLevel !== 'none' && profile.adminLevel !== 'citizen' && (
                                                    <div className="mt-2 space-y-1">
                                                        <Badge className="bg-purple-100 text-purple-700 border-0 hover:bg-purple-200">
                                                            {ROLE_LABELS[profile.adminLevel] || profile.adminLevel}
                                                        </Badge>
                                                        {getJurisdictionDisplay(profile) && (
                                                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {getJurisdictionDisplay(profile)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                                {canManageRoles && profile.userId !== callerProfile?.userId && (
                                                    <button
                                                        onClick={() => handleOpenRoleModal(profile)}
                                                        className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
                                                    >
                                                        Manage Role
                                                    </button>
                                                )}
                                                
                                                {!profile.isVerified ? (
                                                    <button
                                                        disabled={verifyingId === profile.id}
                                                        onClick={() => handleVerifyStatus(profile.id, true)}
                                                        className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors border border-transparent"
                                                    >
                                                        {verifyingId === profile.id ? "Updating..." : "Verify"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled={verifyingId === profile.id}
                                                        onClick={() => handleVerifyStatus(profile.id, false)}
                                                        className="bg-white text-rose-600 border-rose-200 border px-3 py-1.5 rounded text-xs font-medium hover:bg-rose-50 disabled:opacity-50 transition-colors"
                                                    >
                                                        {verifyingId === profile.id ? "Updating..." : "Revoke"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Role Management Modal */}
            <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Manage Civic Staff Role</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {selectedProfile && (
                            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-2">
                                <p className="font-medium text-slate-900">{selectedProfile.fullName || selectedProfile.user?.name || "Unknown Citizen"}</p>
                                <p className="text-xs text-slate-500">{selectedProfile.user?.email}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700">Access Level</label>
                            <select 
                                value={adminLevel} 
                                onChange={(e) => {
                                    setAdminLevel(e.target.value);
                                    if (e.target.value === 'superadmin' || e.target.value === 'none' || e.target.value === 'citizen') {
                                        setJurisdictionState('');
                                        setJurisdictionCity('');
                                        setJurisdictionVillage('');
                                        setJurisdictionWard('');
                                    }
                                }}
                                className="w-full border border-slate-300 rounded-md p-2 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {assignableRoles.map(role => (
                                    <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
                                ))}
                                {/* If caller is superadmin, also allow assigning superadmin */}
                                {callerProfile?.adminLevel === 'superadmin' && (
                                    <option value="superadmin">Super Admin (Global Access)</option>
                                )}
                            </select>
                        </div>

                        {/* Jurisdiction Name Inputs — shown based on selected role level */}
                        {['state', 'city', 'village', 'ward'].includes(adminLevel) && (
                            <div className="space-y-3 bg-blue-50/50 p-4 rounded-md border border-blue-100">
                                <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> Jurisdiction Area
                                </p>
                                
                                {/* State — always shown for location roles */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600">State Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Maharashtra, Delhi..."
                                        value={jurisdictionState}
                                        onChange={(e) => setJurisdictionState(e.target.value)}
                                        disabled={callerProfile?.adminLevel !== 'superadmin' && !!callerProfile?.stateId}
                                        className="w-full border border-slate-300 rounded-md p-2 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                    />
                                    {callerProfile?.adminLevel !== 'superadmin' && callerProfile?.stateId && (
                                        <p className="text-[10px] text-slate-500">Auto-inherited from your jurisdiction</p>
                                    )}
                                </div>

                                {/* City — shown for city, village, ward roles */}
                                {['city', 'village', 'ward'].includes(adminLevel) && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">City / District Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Mumbai, Pune..."
                                            value={jurisdictionCity}
                                            onChange={(e) => setJurisdictionCity(e.target.value)}
                                            disabled={callerProfile?.adminLevel === 'city' && !!callerProfile?.cityId}
                                            className="w-full border border-slate-300 rounded-md p-2 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                        {callerProfile?.adminLevel === 'city' && callerProfile?.cityId && (
                                            <p className="text-[10px] text-slate-500">Auto-inherited from your jurisdiction</p>
                                        )}
                                    </div>
                                )}

                                {/* Village — shown for village, ward roles */}
                                {['village', 'ward'].includes(adminLevel) && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Village / Town Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Andheri, Bandra..."
                                            value={jurisdictionVillage}
                                            onChange={(e) => setJurisdictionVillage(e.target.value)}
                                            disabled={callerProfile?.adminLevel === 'village' && !!callerProfile?.villageId}
                                            className="w-full border border-slate-300 rounded-md p-2 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </div>
                                )}

                                {/* Ward — shown for ward role only */}
                                {adminLevel === 'ward' && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Ward Name / Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Ward 12, Zone A..."
                                            value={jurisdictionWard}
                                            onChange={(e) => setJurisdictionWard(e.target.value)}
                                            className="w-full border border-slate-300 rounded-md p-2 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {adminLevel === 'superadmin' && (
                            <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm border border-amber-200">
                                <ShieldAlert className="inline w-4 h-4 mr-1 -mt-0.5" />
                                <strong>Warning:</strong> Super Admins can access and manage ALL endpoints, users, and locations without restriction.
                            </div>
                        )}
                        
                        {(adminLevel !== 'none' && adminLevel !== 'citizen') && (
                            <div className="bg-purple-50 text-purple-800 p-3 rounded-md text-sm border border-purple-200">
                                Assigning this role will automatically grant the <code>staff</code> security label, allowing access to the secure staff portal route.
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={() => setIsRoleModalOpen(false)}
                            className="px-4 py-2 border rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveRole}
                            disabled={isSaveDisabled()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isSavingRole ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Role
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
