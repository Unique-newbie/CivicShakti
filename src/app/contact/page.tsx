import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Mail, MessageSquare, AlertTriangle } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Translate } from "@/components/Translate";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact & Support | CivicShakti",
    description: "Get help with your CivicShakti account or escalate urgent municipal issues.",
};

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24 relative">
                <div className="absolute top-8 left-6 md:left-0 z-10 w-full max-w-4xl mx-auto flex">
                    <BackButton fallbackHref="/" label="Home" />
                </div>

                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"><Translate tKey="contact.title" /></h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        <Translate tKey="contact.subtitle" />
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">

                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 m-0"><Translate tKey="contact.techSupport.title" /></h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed mb-6 flex-1">
                            <Translate tKey="contact.techSupport.desc" />
                        </p>
                        <a href="mailto:support@civicshakti.org" className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                            support@civicshakti.org →
                        </a>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 m-0"><Translate tKey="contact.feedback.title" /></h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed mb-6 flex-1">
                            <Translate tKey="contact.feedback.desc" />
                        </p>
                        <a href="mailto:feedback@civicshakti.org" className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                            feedback@civicshakti.org →
                        </a>
                    </div>

                </div>

                <div className="bg-amber-50 border border-amber-200 p-8 md:p-10 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 text-amber-700 rounded-full shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3"><Translate tKey="contact.escalation.title" /></h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                <Translate tKey="contact.escalation.desc1" /><strong><Translate tKey="contact.escalation.desc2" /></strong>.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-700 mb-6">
                                <li><Translate tKey="contact.escalation.item1" /></li>
                                <li><Translate tKey="contact.escalation.item2" /></li>
                                <li><strong><Translate tKey="contact.escalation.item3" /></strong></li>
                            </ul>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
}
