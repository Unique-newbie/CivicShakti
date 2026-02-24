import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Target, Users } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Metadata } from "next";
import { Translate } from "@/components/Translate";

export const metadata: Metadata = {
    title: "About Us | CivicShakti",
    description: "Learn about CivicShakti, our mission, and our commitment to transparent digital public infrastructure.",
};

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24 relative">
                <div className="absolute top-8 left-6 md:left-0 z-10 w-full max-w-4xl mx-auto flex">
                    <BackButton fallbackHref="/" />
                </div>

                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"><Translate tKey="about.title" /></h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        <Translate tKey="about.subtitle" />
                    </p>
                </div>

                <div className="prose prose-slate max-w-none space-y-12">

                    <section className="bg-white p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                                <Target className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0"><Translate tKey="about.mission" /></h2>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-lg">
                            <Translate tKey="about.missionText" />
                        </p>
                    </section>

                    <section className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start">
                            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3"><Translate tKey="about.forCitizens" /></h3>
                            <p className="text-slate-600 leading-relaxed flex-1">
                                <Translate tKey="about.forCitizensText" />
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start">
                            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg mb-6">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3"><Translate tKey="about.forAuthorities" /></h3>
                            <p className="text-slate-600 leading-relaxed flex-1">
                                <Translate tKey="about.forAuthoritiesText" />
                            </p>
                        </div>
                    </section>

                    <section className="bg-slate-900 text-white p-8 md:p-10 rounded-xl">
                        <h2 className="text-2xl font-bold mb-4"><Translate tKey="about.commitmentTitle" /></h2>
                        <div className="space-y-4 text-slate-300">
                            <p><Translate tKey="about.commitmentSubtitle" /></p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong><Translate tKey="about.nonCommercial" /></strong> <Translate tKey="about.nonCommercialText" /></li>
                                <li><strong><Translate tKey="about.radicalTransparency" /></strong> <Translate tKey="about.radicalTransparencyText" /></li>
                                <li><strong><Translate tKey="about.equitableAccess" /></strong> <Translate tKey="about.equitableAccessText" /></li>
                            </ul>
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
