"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    UserCircle, Trash2, Loader2, ShieldCheck, ShieldAlert, Mail,
    ChevronLeft, ChevronRight, Search, Calendar, Shield
} from "lucide-react";
import { getAuthJWT } from "@/lib/auth-helpers";

interface UserAccount {
    id: string;
    name: string;
    email: string;
    phone: string;
    labels: string[];
    emailVerification: boolean;
    status: boolean;
    registration: string;
    createdAt: string;
    lastActivity: string;
    profile: {
        id: string;
        fullName: string;
        adminLevel: string;
        isVerified: boolean;
        trustScore: number;
    } | null;
}

const ROLE_COLORS: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-700",
    state: "bg-indigo-100 text-indigo-700",
    city: "bg-blue-100 text-blue-700",
    village: "bg-emerald-100 text-emerald-700",
    ward: "bg-amber-100 text-amber-700",
    none: "bg-slate-100 text-slate-500",
    citizen: "bg-slate-100 text-slate-500",
};

export default function AccountsPage() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUsers(page);
    }, [page]);

    const fetchUsers = async (p: number) => {
        setIsLoading(true);
        try {
            const token = await getAuthJWT();
            const res = await fetch(`/api/staff/accounts?page=${p}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch");
            }
            const data = await res.json();
            setUsers(data.users);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to load accounts.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const token = await getAuthJWT();
            const res = await fetch('/api/staff/accounts', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: deleteTarget.id }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
            setTotal(prev => prev - 1);
            toast.success(`Account ${deleteTarget.email} deleted successfully.`);
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete account.");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
        } catch { return "—"; }
    };

    const filteredUsers = search.trim()
        ? users.filter(u =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.profile?.fullName?.toLowerCase().includes(search.toLowerCase())
        )
        : users;

    if (isLoading && page === 1) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading accounts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Accounts</h1>
                    <p className="text-slate-500">{total} total registered accounts</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md border border-slate-200 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Joined</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                            {search ? "No matching accounts." : "No accounts found."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        let role = u.profile?.adminLevel || 'citizen';
                                        if (u.labels?.includes('superadmin')) {
                                            role = 'superadmin';
                                        }
                                        const isStaff = u.labels?.includes('staff') || role === 'superadmin';
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isStaff ? 'bg-purple-100' : 'bg-slate-200'}`}>
                                                            {isStaff ? (
                                                                <Shield className="w-4 h-4 text-purple-600" />
                                                            ) : (
                                                                <UserCircle className="w-5 h-5 text-slate-500" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">
                                                                {u.profile?.fullName || u.name || "—"}
                                                            </p>
                                                            {u.profile?.trustScore !== undefined && (
                                                                <p className="text-[10px] text-slate-400">
                                                                    Trust: {u.profile.trustScore}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-700 text-xs">{u.email}</span>
                                                        {u.emailVerification && (
                                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge className={`${ROLE_COLORS[role] || ROLE_COLORS.none} border-0 text-xs`}>
                                                        {role === 'none' || role === 'citizen' ? 'Citizen' : role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {u.profile?.isVerified ? (
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Verified</Badge>
                                                    ) : (
                                                        <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-xs">Unverified</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(u.createdAt)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => setDeleteTarget(u)}
                                                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors"
                                                        title="Delete account"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                            <p className="text-xs text-slate-500">
                                Page {page} of {totalPages} ({total} accounts)
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="h-8 px-3"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="h-8 px-3"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                    </DialogHeader>
                    {deleteTarget && (
                        <div className="space-y-4">
                            <div className="bg-rose-50 border border-rose-200 rounded-md p-3">
                                <p className="text-sm text-rose-800">
                                    <ShieldAlert className="inline w-4 h-4 mr-1 -mt-0.5" />
                                    <strong>Warning:</strong> This will permanently delete the user account and their profile. This action cannot be undone.
                                </p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-md border">
                                <p className="font-medium text-slate-900">{deleteTarget.profile?.fullName || deleteTarget.name || "Unknown"}</p>
                                <p className="text-xs text-slate-500">{deleteTarget.email}</p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                                <Button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
