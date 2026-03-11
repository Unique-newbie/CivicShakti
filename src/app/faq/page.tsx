import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Metadata } from "next";
import { Translate } from "@/components/Translate";

export const metadata: Metadata = {
    title: "Frequently Asked Questions | CivicShakti",
    description: "Find answers to common questions about reporting local infrastructure issues.",
};

export default function FAQPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16 md:py-24 relative">
                <div className="absolute top-8 left-6 md:left-0 z-10 w-full max-w-3xl mx-auto flex">
                    <BackButton fallbackHref="/" />
                </div>

                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"><Translate tKey="faq.title" /></h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        <Translate tKey="faq.subtitle" />
                    </p>
                </div>

                <div className="space-y-6">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <div key={num} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-3"><Translate tKey={`faq.q${num}`} /></h3>
                            <p className="text-slate-600 leading-relaxed">
                                <Translate tKey={`faq.a${num}`} />
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-blue-50 border border-blue-100 p-8 rounded-xl text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2"><Translate tKey="faq.stillHaveQuestions" /></h3>
                    <p className="text-slate-600 mb-6">
                        <Translate tKey="faq.contactSupportText" />
                    </p>
                    <a href="/contact" className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
                        <Translate tKey="faq.contactSupportBtn" />
                    </a>
                </div>
            </main>

            <Footer />
        </div>
    );
}
