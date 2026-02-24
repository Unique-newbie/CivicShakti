import { Loader2 } from "lucide-react";

export default function StaffLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-sm font-medium animate-pulse">Loading Staff Portal...</p>
            </div>
        </div>
    );
}
