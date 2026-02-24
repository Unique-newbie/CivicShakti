"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error locally for debugging
        console.error("Application Error:", error);

        // Automatically report the error to Appwrite
        const reportError = async () => {
            try {
                const { databases, appwriteConfig } = await import("@/lib/appwrite");
                const { ID } = await import("appwrite");
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    "error_logs", // The collection ID we just created
                    ID.unique(),
                    {
                        errorMessage: error.message || "Unknown error",
                        errorStack: error.stack || "",
                        componentStack: error.digest || "",
                        url: typeof window !== "undefined" ? window.location.href : "Server-side",
                        userId: "anonymous", // we'd ideally fetch this but for a global handler, keep it safe
                    }
                );
            } catch (err) {
                console.error("Failed to automatically report error to DB:", err);
            }
        };

        reportError();
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Something went wrong!</h2>

                <p className="text-slate-500 leading-relaxed">
                    We apologize, but an unexpected error has occurred. Our team has been notified.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        onClick={() => reset()}
                        variant="outline"
                        className="flex-1 border-slate-200"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try again
                    </Button>
                    <Link href="/" className="flex-1">
                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                            <Home className="w-4 h-4 mr-2" />
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
