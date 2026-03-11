'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Copy, Check, Home, RotateCcw } from 'lucide-react';
import { logClientError } from '@/lib/logError';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        logClientError(error, { source: 'GlobalErrorBoundary' });
    }, [error]);

    const errorCode = error.digest || 'ERR_UNKNOWN';

    const copyErrorCode = async () => {
        try {
            await navigator.clipboard.writeText(errorCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard API not available */ }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Something went wrong
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        An unexpected error occurred. Please try again. If this keeps happening, share the error code below with support.
                    </p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        Error Code: <strong>{errorCode}</strong>
                    </span>
                    <button
                        onClick={copyErrorCode}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Copy error code"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                        )}
                    </button>
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
