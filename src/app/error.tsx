"use client";

import { useEffect } from "react";
import { logClientError } from "@/lib/logError";
import Link from "next/link";
import { AlertOctagon, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application Error:", error);

        // Log the error to our Appwrite Error logs collection via secure server
        logClientError(error, { digest: error.digest, context: "global_error_boundary" });
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <AlertOctagon className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Something went wrong!</h2>

                <p className="text-slate-500 leading-relaxed text-sm">
                    We apologize, but an unexpected error has occurred. Our engineering team has been notified.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                    <Button
                        onClick={() => reset()}
                        variant="outline"
                        className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try again
                    </Button>
                    <Link href="/" className="flex-1 block">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Home className="w-4 h-4 mr-2" />
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

