import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="text-8xl font-bold text-orange-500/20 select-none">
                    404
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Page Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        The page you're looking for doesn't exist or has been moved.
                        If you were tracking a complaint, double-check your tracking ID.
                    </p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        Error Code: <strong>ERR_NOT_FOUND (404)</strong>
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                    <Link
                        href="/track"
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        <Search className="w-4 h-4" />
                        Track Complaint
                    </Link>
                    <Link
                        href="/explore"
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Explore Map
                    </Link>
                </div>
            </div>
        </div>
    );
}
