import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Camera, MapPin, CheckCircle, RefreshCw, BarChart } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Translate } from "@/components/Translate";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "How It Works | CivicShakti",
    description: "Learn how to report an issue, track progress, and see resolutions on the CivicShakti platform.",
};

export default function HowItWorksPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24 relative">
                <div className="absolute top-8 left-6 md:left-0 z-10 w-full max-w-4xl mx-auto flex">
                    <BackButton fallbackHref="/" label="Home" />
                </div>

                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"><Translate tKey="howItWorks.title" /></h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        <Translate tKey="howItWorks.subtitle" />
                    </p>
                </div>

                <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">

                    {/* Step 1 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            1
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                                <Camera className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2"><Translate tKey="howItWorks.step1Title" /></h3>
                                <p className="text-slate-600 leading-relaxed">
                                    <Translate tKey="howItWorks.step1Desc" />
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            2
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4">
                            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
                                <RefreshCw className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2"><Translate tKey="howItWorks.step2Title" /></h3>
                                <p className="text-slate-600 leading-relaxed">
                                    <Translate tKey="howItWorks.step2Desc" />
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            3
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2"><Translate tKey="howItWorks.step3Title" /></h3>
                                <p className="text-slate-600 leading-relaxed">
                                    <Translate tKey="howItWorks.step3Desc" />
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Post Resolution */}
                <div className="mt-20 bg-slate-900 text-white p-8 md:p-10 rounded-xl flex flex-col md:flex-row items-center gap-8">
                    <div className="p-4 bg-white/10 rounded-full shrink-0">
                        <BarChart className="w-12 h-12 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-3"><Translate tKey="howItWorks.trustTitle" /></h2>
                        <p className="text-slate-300 leading-relaxed">
                            <Translate tKey="howItWorks.trustDesc" />
                        </p>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
}
