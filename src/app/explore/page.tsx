"use client";

import dynamic from 'next/dynamic';
import { ShieldAlert, Info } from 'lucide-react';
import { ClientAuthNav } from '@/components/ClientAuthNav';

// Dynamically import the map to disable SSR
const PublicMap = dynamic(() => import('@/components/PublicMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] flex items-center justify-center bg-slate-100 rounded-sm border border-slate-200 animate-pulse">
            <p className="text-slate-500 font-medium">Initializing Map Engine...</p>
        </div>
    )
});

export default function ExplorePage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xl tracking-tight">
                        <ShieldAlert className="w-6 h-6" />
                        <span>CivicShakti</span>
                    </div>
                    <nav>
                        <ClientAuthNav />
                    </nav>
                </div>
            </header>

            <main className="flex-1 flex flex-col pt-8 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1 flex flex-col">
                    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Neighborhood Watch Map</h1>
                            <p className="text-slate-600 mt-2 max-w-2xl text-lg">
                                See what's already been reported in your area. This helps prevent duplicate reports and keeps our community informed about ongoing fixes.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-blue-800 bg-blue-50 px-4 py-2 rounded-sm border border-blue-200 shrink-0">
                            <Info className="w-4 h-4" />
                            <span>Resolved issues are hidden from this view.</span>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="relative rounded-sm overflow-hidden shadow-none border border-slate-300 mt-2 bg-white h-[650px]">
                        <PublicMap />
                    </div>
                </div>
            </main>
        </div>
    );
}
