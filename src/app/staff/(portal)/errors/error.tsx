"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorLogsBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Error Logs Boundary caught error:", error);
    }, [error]);

    return (
        <div className="flex-1 p-6 flex items-center justify-center">
            <Card className="max-w-md w-full border-rose-200 bg-rose-50/30">
                <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                        <AlertOctagon className="w-8 h-8 text-rose-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Unexpected System Error</h2>
                        <p className="text-slate-600 text-sm mb-4">
                            The error logging system encountered a critical failure and could not load. This might be due to a complete database outage.
                        </p>
                        <div className="bg-slate-900 rounded p-3 text-left overflow-auto mb-6">
                            <p className="font-mono text-xs text-rose-400 break-words">
                                {error.message || "Unknown error occurred"}
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => reset()}
                        variant="outline"
                        className="w-full border-rose-200 hover:bg-rose-100 text-rose-700"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
