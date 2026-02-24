"use client";

import { useEffect, useState } from "react";
import { databases, appwriteConfig } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertOctagon, Loader2, ArrowUpDown } from "lucide-react";

interface ErrorLog {
    $id: string;
    message: string;
    stack?: string;
    context?: string;
    url?: string;
    user_id?: string;
    $createdAt: string;
}

export default function ErrorsPage() {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchErrors() {
            try {
                const response = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.errorLogsCollectionId,
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(100)
                    ]
                );
                setErrors(response.documents as unknown as ErrorLog[]);
            } catch (error) {
                console.error("Failed to fetch error logs:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchErrors();
    }, []);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ago`;
        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <Card className="rounded-sm border-rose-300 shadow-none">
            <CardHeader className="border-b border-rose-300 bg-rose-50/50 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-rose-950">
                            <AlertOctagon className="w-5 h-5 text-rose-500" />
                            System Errors
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            Recent unhandled exceptions and captured client errors.
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead className="max-w-[300px]">Message</TableHead>
                                <TableHead>Context</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>User ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {errors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                        No recent errors found. System is healthy.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                errors.map((err) => (
                                    <TableRow key={err.$id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium text-slate-700">
                                            <div className="flex flex-col">
                                                <span>{new Date(err.$createdAt).toLocaleDateString()}</span>
                                                <span className="text-xs text-slate-400">{formatTimeAgo(err.$createdAt)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 font-mono text-[10px]">ERROR</Badge>
                                                <span className="font-medium text-slate-800 line-clamp-2" title={err.message}>
                                                    {err.message}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600 underline decoration-slate-300 decoration-dashed">
                                                {err.context || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-500 max-w-[200px] truncate block" title={err.url}>
                                                {err.url || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-sm border border-slate-200">
                                                {err.user_id || "Anonymous"}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
