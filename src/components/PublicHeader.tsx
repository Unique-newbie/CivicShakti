import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ClientAuthNav } from "./ClientAuthNav";

export function PublicHeader() {
    return (
        <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex-none z-50 sticky top-0">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-blue-700 font-bold text-xl tracking-tight transition-opacity hover:opacity-80">
                    <ShieldAlert className="w-6 h-6" />
                    <span>CivicShakti</span>
                </Link>
                <nav>
                    <ClientAuthNav />
                </nav>
            </div>
        </header>
    );
}
