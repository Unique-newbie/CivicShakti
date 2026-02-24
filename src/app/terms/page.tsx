import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | CivicShakti",
    description: "Read the rules and obligations for using the CivicShakti platform.",
};

export default function TermsOfServicePage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24">
                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        These terms define our mutual obligations to maintain a secure, actionable, and respectful civic environment.
                    </p>
                    <p className="text-sm text-slate-500">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="prose prose-slate max-w-none space-y-12 bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-slate-700 leading-relaxed">
                            By accessing or using the CivicShakti platform as a citizen reporter or a municipal staff member, you agree to be bound by these Terms of Service. If you do not agree to all terms, do not use the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. User Obligations</h2>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            As a user contributing to public municipal records, you agree to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700">
                            <li>Submit truthful, accurate, and current information regarding civic issues.</li>
                            <li>Provide original photographic evidence taken by yourself, unmodified.</li>
                            <li>Ensure the geolocation pin accurately reflects the location of the issue.</li>
                            <li>Maintain the security of your account credentials.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Prohibited Activities</h2>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            To preserve the integrity of the platform for municipal action, the following behaviors are strictly prohibited:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700">
                            <li>Submitting false, fabricated, or deceptive reports.</li>
                            <li>Uploading explicit, offensive, or identifying photos of private individuals without consent.</li>
                            <li>Attempting to manipulate the "Trust Score" or upvote system using automated means or multiple accounts.</li>
                            <li>Using the platform to report time-critical emergencies (e.g., active fires, crimes in progress). <strong>Always call emergency services (911/112) for immediate threats.</strong></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Consequences of Misuse</h2>
                        <p className="text-slate-700 leading-relaxed">
                            Violation of these terms may result in the immediate reduction of your "Trust Score", rejection of active reports, or permanent suspension of your account without notice. Reports flagged as malicious by AI triage or municipal staff may be referred to local authorities if they constitute digital harassment.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Limitation of Liability</h2>
                        <p className="text-slate-700 leading-relaxed">
                            CivicShakti acts as a facilitation layer between citizens and government. We do not guarantee that your reported issue will be fixed within a specific timeframe; this relies entirely on the corresponding municipal department. We are not liable for property damage, injury, or loss resulting from the civic issues reported on this platform, nor for any delays in their resolution.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Dispute Handling</h2>
                        <p className="text-slate-700 leading-relaxed">
                            If you believe a report was unjustly rejected, or if you have a dispute regarding your account status, you may contact our moderation team. Platform administration decisions regarding account suspensions or Trust Score penalties are final.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
