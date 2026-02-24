"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Filter,
    Search,
    MoreVertical,
    MapPin,
    Clock,
    ArrowUpDown,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Download,
    ShieldAlert,
    Zap,
    Droplets,
    Wind,
    Building2,
    AlertTriangle
} from "lucide-react";
import { downloadCSV } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { databases, appwriteConfig } from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "sonner";
import { getSLAStatus } from "@/lib/slas";

interface Complaint {
    $id: string;
    tracking_id: string;
    category: string;
    description: string;
    address: string;
    citizen_contact: string;
    image_url: string;
    status: string;
    department: string;
    $createdAt: string;
    upvotes?: number;
    ai_priority_score?: number;
    ai_analysis?: string;
}

export default function ComplaintList() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.has('q')) {
                setSearchTerm(params.get('q') || '');
            }
        }
    }, []);

    useEffect(() => {
        async function fetchComplaints() {
            try {
                const response = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.complaintsCollectionId,
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(500) // Fetch up to 500 for client-side pagination
                    ]
                );
                setComplaints(response.documents as unknown as Complaint[]);
            } catch (error) {
                console.error("Error fetching complaints:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchComplaints();
    }, []);

    const handleAutoAssign = async () => {
        const pending = complaints.filter(c => c.status === 'pending');
        if (pending.length === 0) {
            toast.info("No pending complaints to auto-assign.");
            return;
        }

        try {
            toast.loading("Auto-assigning pending complaints...", { id: "auto-assign" });

            // In a real app we'd map this to a specific staff member based on department.
            // For MVP, we auto-acknowledge by changing status to in_progress
            const promises = pending.map(c =>
                databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.complaintsCollectionId, c.$id, {
                    status: 'in_progress'
                })
            );
            await Promise.all(promises);

            setComplaints(prev => prev.map(c => c.status === 'pending' ? { ...c, status: 'in_progress' } : c));

            toast.success(`Successfully assigned ${pending.length} complaints to active staff queues.`, { id: "auto-assign" });
        } catch (err) {
            console.error("Auto assign error:", err);
            toast.error("Failed to auto-assign complaints. Please try again.", { id: "auto-assign" });
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, categoryFilter, departmentFilter, startDate, endDate]);

    const filteredComplaints = complaints.filter(c => {
        const matchesSearch = searchTerm === "" ||
            c.tracking_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.address?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "" || c.status === statusFilter;
        const matchesCategory = categoryFilter === "" || c.category === categoryFilter;
        const matchesDepartment = departmentFilter === "" || c.department === departmentFilter;

        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && new Date(c.$createdAt) >= new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1); // Make inclusive
            matchesDate = matchesDate && new Date(c.$createdAt) <= end;
        }

        return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesDate;
    });

    const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return "Just now";
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
            case 'in_progress':
            case 'progress': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'resolved': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
            case 'escalated': return 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-100';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const formatStatus = (status: string) => {
        if (status === 'in_progress') return 'In Progress';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Complaints</h1>
                    <p className="text-slate-500 mt-1">Manage and update all citizen reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200" onClick={() => {
                        const exportData = filteredComplaints.map(c => ({
                            ID: c.$id,
                            Category: c.category,
                            User: c.citizen_contact || "Anonymous",
                            Location: c.address,
                            Status: c.status,
                            Upvotes: c.upvotes || 0,
                            Description: c.description,
                            CreatedAt: new Date(c.$createdAt).toLocaleString()
                        }));
                        downloadCSV(exportData, `complaints_${new Date().toISOString().split('T')[0]}.csv`);
                        toast.success("CSV exported successfully");
                    }}>
                        Export CSV
                    </Button>
                    <Button className="bg-blue-700 hover:bg-blue-800" onClick={handleAutoAssign}>
                        Auto-Assign
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <Card className="rounded-sm border-slate-300 bg-white shadow-none">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by Tracking ID, Category, or Location..."
                            className="pl-9 h-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            className="h-10 px-3 rounded-sm border border-slate-300 text-sm bg-white min-w-[140px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="escalated">Escalated</option>
                        </select>

                        <select
                            className="h-10 px-3 rounded-sm border border-slate-300 text-sm bg-white min-w-[140px]"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="pothole">Pothole</option>
                            <option value="streetlight">Streetlight</option>
                            <option value="garbage">Garbage</option>
                            <option value="water">Water</option>
                            <option value="electricity">Electricity</option>
                            <option value="other">Other</option>
                        </select>

                        <Button
                            variant="outline"
                            className={`h-10 px-3 border-slate-300 rounded-sm ${showAdvancedFilters ? 'bg-slate-100' : ''}`}
                            title="Advanced Filters"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>

                    {showAdvancedFilters && (
                        <div className="flex flex-wrap gap-4 mt-2 pt-4 border-t border-slate-100 w-full animate-in slide-in-from-top-2">
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                <label className="text-xs font-medium text-slate-500">Department</label>
                                <select
                                    className="h-10 px-3 rounded-sm border border-slate-300 text-sm bg-white"
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                >
                                    <option value="">All Departments</option>
                                    <option value="Roads">Roads</option>
                                    <option value="Water">Water</option>
                                    <option value="Sanitation">Sanitation</option>
                                    <option value="Electricity">Electricity</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-slate-500">Start Date</label>
                                <Input
                                    type="date"
                                    className="h-10 w-auto"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-slate-500">End Date</label>
                                <Input
                                    type="date"
                                    className="h-10 w-auto"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            {(departmentFilter || startDate || endDate) && (
                                <div className="flex items-end flex-1">
                                    <Button
                                        variant="ghost"
                                        className="text-slate-500 hover:text-slate-900"
                                        onClick={() => {
                                            setDepartmentFilter("");
                                            setStartDate("");
                                            setEndDate("");
                                        }}
                                    >
                                        Clear Advanced
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Main Table */}
            <Card className="rounded-sm border-slate-300 shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b-2 border-slate-300 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-300 whitespace-nowrap">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">Tracking ID <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th className="px-6 py-4 border-b border-slate-300">Complaint Details</th>
                                <th className="px-6 py-4 border-b border-slate-300">Status</th>
                                <th className="px-6 py-4 border-b border-slate-300">Upvotes</th>
                                <th className="px-6 py-4 border-b border-slate-300">Department</th>
                                <th className="px-6 py-4 border-b border-slate-300">Priority (AI)</th>
                                <th className="px-6 py-4 border-b border-slate-300 whitespace-nowrap">Citizen</th>
                                <th className="px-6 py-4 border-b border-slate-300 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-slate-900"><ArrowUpDown className="w-3 h-3" /> Time Logged</div>
                                </th>
                                <th className="px-6 py-4 border-b border-slate-300 text-center">SLA Status</th>
                                <th className="px-6 py-4 border-b border-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Loading complaints data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                        No complaints found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedComplaints.map((item) => (
                                    <tr
                                        key={item.$id}
                                        onClick={() => router.push(`/staff/complaints/${item.tracking_id}`)}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer bg-white"
                                    >
                                        <td className="px-6 py-4 font-mono font-medium text-slate-900 border-l-4 border-l-transparent group-hover:border-l-blue-500">
                                            #{item.tracking_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 capitalize">{item.category}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate max-w-[250px]">{item.address || "Location not provided"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="secondary"
                                                className={`font-medium ${getStatusStyle(item.status)}`}
                                            >
                                                {formatStatus(item.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                👍 {item.upvotes || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-700 font-medium text-sm">
                                                {item.department || "Unassigned"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.ai_priority_score !== undefined ? (
                                                <Badge
                                                    variant="secondary"
                                                    className={`
                                                        ${item.ai_priority_score >= 80 ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : ''}
                                                        ${item.ai_priority_score >= 40 && item.ai_priority_score < 80 ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}
                                                        ${item.ai_priority_score < 40 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                                                    `}
                                                >
                                                    {item.ai_priority_score}/100
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 text-sm">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {item.citizen_contact || 'Anonymous'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatTimeAgo(item.$createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(() => {
                                                const sla = getSLAStatus(item.$createdAt, item.category, item.status);
                                                if (item.status === 'resolved') return <span className="text-slate-400 text-xs">Resolved</span>;

                                                return (
                                                    <Badge variant="outline" className={`font-medium ${sla.status === 'breached' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        sla.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}>
                                                        {sla.status === 'breached' ? 'Breached' : sla.status === 'warning' ? 'Warning' : 'On Track'}
                                                        {sla.status !== 'good' && ` (${Math.ceil(sla.status === 'breached' ? sla.hoursOverdue : sla.hoursRemaining)}h)`}
                                                    </Badge>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600" asChild>
                                                <Link href={`/staff/complaints/${item.tracking_id}`}>
                                                    <MoreVertical className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-300 bg-slate-50">
                    <span className="text-sm text-slate-500">
                        Showing {filteredComplaints.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length} entries
                    </span>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            Prev
                        </Button>
                        <span className="flex items-center px-4 text-sm font-medium text-slate-700">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white"
                            disabled={currentPage >= totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

        </div>
    );
}

