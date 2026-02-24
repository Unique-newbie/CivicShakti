import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Target, Users } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us | CivicShakti",
    description: "Learn about CivicShakti, our mission, and our commitment to transparent digital public infrastructure.",
};

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24">
                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">About CivicShakti</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        A digital public infrastructure platform built to bridge the gap between citizens and authorities through transparency, accountability, and speed.
                    </p>
                </div>

                <div className="prose prose-slate max-w-none space-y-12">

                    <section className="bg-white p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                                <Target className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0">Our Mission</h2>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-lg">
                            We believe that effective governance starts with being able to hear and respond to citizens clearly.
                            Our mission is to establish a seamless, incorruptible pipeline for reporting civic issues, ensuring that every
                            broken streetlight, neglected park, and pothole is documented, assigned, and resolved with photographic proof.
                        </p>
                    </section>

                    <section className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start">
                            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">For Citizens</h3>
                            <p className="text-slate-600 leading-relaxed flex-1">
                                We remove the anxiety of the "black hole" complaint process. By tracking issues publically on a map and demanding status updates, citizens can finally see their tax dollars at work, restoring trust in public institutions.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start">
                            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg mb-6">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">For Authorities</h3>
                            <p className="text-slate-600 leading-relaxed flex-1">
                                We organize chaos. By leveraging automated AI triage, geospatial clustering, and strict escalation timelines, municipal workers receive prioritized, actionable intelligence rather than thousands of duplicate emails.
                            </p>
                        </div>
                    </section>

                    <section className="bg-slate-900 text-white p-8 md:p-10 rounded-xl">
                        <h2 className="text-2xl font-bold mb-4">Our Commitment to the Public Interest</h2>
                        <div className="space-y-4 text-slate-300">
                            <p>CivicShakti is built on principles of open governance:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Non-Commercial Focus:</strong> We do not sell citizen data, nor do we run advertisements tracking user behavior.</li>
                                <li><strong>Radical Transparency:</strong> Complaint statuses are logged immutably. When a complaint is closed, photographic evidence is mandatory.</li>
                                <li><strong>Equitable Access:</strong> The platform is designed to be accessible on low-end devices and respects user privacy at all stages.</li>
                            </ul>
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
