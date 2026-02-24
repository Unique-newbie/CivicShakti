import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6 mt-auto">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-lg tracking-tight">
                        <ShieldAlert className="w-5 h-5" />
                        <span>CivicShakti</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pr-4">
                        A digital public infrastructure platform empowering citizens to report local issues and accelerating municipal response through transparency and accountability.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Platform</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li>
                            <Link href="/about" className="hover:text-blue-700 transition-colors">About Us</Link>
                        </li>
                        <li>
                            <Link href="/how-it-works" className="hover:text-blue-700 transition-colors">How It Works</Link>
                        </li>
                        <li>
                            <Link href="/faq" className="hover:text-blue-700 transition-colors">FAQs</Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Legal & Trust</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li>
                            <Link href="/privacy" className="hover:text-blue-700 transition-colors">Privacy Policy</Link>
                        </li>
                        <li>
                            <Link href="/terms" className="hover:text-blue-700 transition-colors">Terms of Service</Link>
                        </li>
                        <li>
                            <Link href="/accessibility" className="hover:text-blue-700 transition-colors">Accessibility Statement</Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Support</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li>
                            <Link href="/contact" className="hover:text-blue-700 transition-colors">Contact Support</Link>
                        </li>
                        <li>
                            <Link href="/track" className="hover:text-blue-700 transition-colors">Track an Issue</Link>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
                <p>© {currentYear} CivicShakti Platform. A civic technology initiative.</p>
                <div className="flex items-center gap-4">
                    <span className="text-slate-400">Public Service First</span>
                </div>
            </div>
        </footer>
    );
}
