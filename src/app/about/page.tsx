import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Target, Users, Code2, Server, TrendingUp, Lightbulb, MapPin, Zap } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Metadata } from "next";
import { Translate } from "@/components/Translate";

export const metadata: Metadata = {
    title: "About Us | CivicShakti",
    description: "Learn about CivicShakti, our mission, technical architecture, and our commitment to transparent digital public infrastructure.",
};

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-16 md:py-24 relative">
                <div className="absolute top-8 left-6 md:left-0 z-10 w-full mx-auto flex">
                    <BackButton fallbackHref="/" />
                </div>

                <div className="space-y-4 mb-20 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight"><Translate tKey="about.title" /></h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        <Translate tKey="about.subtitle" />
                    </p>
                </div>

                <div className="space-y-20">
                    {/* Mission Section */}
                    <section className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                                <Target className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 m-0"><Translate tKey="about.mission" /></h2>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-lg max-w-4xl">
                            <Translate tKey="about.missionText" />
                            {" "}CivicShakti exists to bridge the gap between citizens experiencing infrastructural issues and the municipal authorities responsible for fixing them. By completely digitizing the reporting, tracking, and resolution pipeline, we eliminate bureaucratic friction and foster a culture of accountability.
                        </p>
                    </section>

                    {/* How It Works Section */}
                    <section className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">How CivicShakti Works</h2>
                            <p className="text-slate-600 max-w-2xl mx-auto">A seamless, AI-powered pipeline from the moment a problem is spotted to the moment it is resolved.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                <MapPin className="w-10 h-10 text-emerald-600 mb-6" />
                                <h3 className="text-xl font-bold text-slate-900 mb-3">1. Pinpoint & Report</h3>
                                <p className="text-slate-600 leading-relaxed">Citizens drop a precise GPS pin and snap a photo of the issue. Our platform automatically extracts location meta-data.</p>
                            </div>
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                <Zap className="w-10 h-10 text-amber-500 mb-6" />
                                <h3 className="text-xl font-bold text-slate-900 mb-3">2. AI Triage</h3>
                                <p className="text-slate-600 leading-relaxed">Google Gemini AI immediately analyzes the text and image, verifying legitimacy, assigning priority scores, and routing to the exact department.</p>
                            </div>
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                <ShieldCheck className="w-10 h-10 text-blue-600 mb-6" />
                                <h3 className="text-xl font-bold text-slate-900 mb-3">3. Transparent Resolution</h3>
                                <p className="text-slate-600 leading-relaxed">Officials update statuses via a secure internal board. Citizens track progress on live maps and receive automated email alerts at every step.</p>
                            </div>
                        </div>
                    </section>

                    {/* Dual Portals */}
                    <section className="grid md:grid-cols-2 gap-8">
                        <div className="bg-emerald-50 p-8 rounded-xl border border-emerald-100 flex flex-col items-start">
                            <div className="p-3 bg-emerald-200 text-emerald-800 rounded-lg mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-emerald-950 mb-3"><Translate tKey="about.forCitizens" /></h3>
                            <p className="text-emerald-800/80 leading-relaxed flex-1">
                                <Translate tKey="about.forCitizensText" />
                            </p>
                        </div>

                        <div className="bg-blue-50 p-8 rounded-xl border border-blue-100 flex flex-col items-start">
                            <div className="p-3 bg-blue-200 text-blue-800 rounded-lg mb-6">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-950 mb-3"><Translate tKey="about.forAuthorities" /></h3>
                            <p className="text-blue-800/80 leading-relaxed flex-1">
                                <Translate tKey="about.forAuthoritiesText" />
                            </p>
                        </div>
                    </section>

                    {/* Technical Architecture */}
                    <section className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
                                <Code2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 m-0">Technical Architecture</h2>
                        </div>
                        <p className="text-slate-600 mb-8 max-w-3xl text-lg">
                            CivicShakti is engineered for high scalability and rapid deployment, utilizing a modern Edge-ready technology stack.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><Server className="w-5 h-5 text-indigo-500" /> Frontend & API</h4>
                                <ul className="space-y-3 text-slate-600">
                                    <li><strong>Framework:</strong> Next.js 16 (App Router) + React 19</li>
                                    <li><strong>TypeScript:</strong> End-to-end type safety for rock-solid stability.</li>
                                    <li><strong>Styling:</strong> Tailwind CSS v4 alongside Shadcn UI & Radix UI primitives.</li>
                                    <li><strong>Mapping:</strong> React-Leaflet for rich, interactive geospatial data visualization.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><Server className="w-5 h-5 text-indigo-500" /> Backend Infrastructure</h4>
                                <ul className="space-y-3 text-slate-600">
                                    <li><strong>Database & Auth:</strong> Appwrite Cloud (NoSQL Object Store + Edge Functions + JWT Auth).</li>
                                    <li><strong>AI Engine:</strong> Google Gemini 1.5 API for multimodel analysis of complaint evidence.</li>
                                    <li><strong>Security:</strong> Bot mitigation via FingerprintJS + strict server-side Zod validation.</li>
                                    <li><strong>Notifications:</strong> Nodemailer integration hooked directly into Next.js API boundaries.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Business Plan / Future */}
                    <section className="bg-slate-900 text-white p-8 md:p-12 rounded-2xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-lg">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold m-0">Business Roadmap & Future</h2>
                        </div>

                        <div className="grid md:grid-cols-1 gap-8 relative z-10 text-slate-300">
                            <p className="text-lg leading-relaxed mb-4">
                                While currently an open-source civic tech MVP, CivicShakti is designed with a sustainable B2G (Business-to-Government) saas model in mind. Our roadmap focuses on expanding horizontal integration across more public sectors while deepening vertical analytics.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-400" /> Phase 1: SaaS Licensing</h4>
                                    <p className="text-sm">White-labeled licensing for municipal corporations. Governments pay a tiered monthly fee based on user volume and advanced AI usage tiers.</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-400" /> Phase 2: Hyper-Local Analytics</h4>
                                    <p className="text-sm">Selling anonymized, macro-level infrastructure failure data to urban planning firms, real estate analytics companies, and civic NGOs.</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-400" /> Phase 3: Hardware Integration</h4>
                                    <p className="text-sm">Connecting the platform to IoT devices (e.g., smart bins, traffic camera sensors) to automatically generate complaints before humans even notice.</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-400" /> Phase 4: Gamification Economy</h4>
                                    <p className="text-sm">Partnering with local businesses to reward highly trusted reporters with local discounts (Civic Coins), driving local economic engagement.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Commitments */}
                    <section className="bg-slate-100 p-8 md:p-10 rounded-xl">
                        <h2 className="text-2xl font-bold mb-4 text-slate-900"><Translate tKey="about.commitmentTitle" /></h2>
                        <div className="space-y-4 text-slate-700">
                            <p><Translate tKey="about.commitmentSubtitle" /></p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong><Translate tKey="about.nonCommercial" />:</strong> <Translate tKey="about.nonCommercialText" /></li>
                                <li><strong><Translate tKey="about.radicalTransparency" />:</strong> <Translate tKey="about.radicalTransparencyText" /></li>
                                <li><strong><Translate tKey="about.equitableAccess" />:</strong> <Translate tKey="about.equitableAccessText" /></li>
                            </ul>
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
