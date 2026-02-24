import { Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page Not Found | CivicShakti",
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">404 - Page Not Found</h2>

                <p className="text-slate-500 leading-relaxed">
                    We couldn't locate the page you're looking for. It might have been moved or removed.
                </p>

                <div className="pt-4">
                    <Link href="/">
                        <Button className="bg-slate-900 text-white hover:bg-slate-800 w-full sm:w-auto">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
