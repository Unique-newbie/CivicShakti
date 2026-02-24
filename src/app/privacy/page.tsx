import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | CivicShakti",
    description: "Learn how we collect, use, and protect your data when using the CivicShakti platform.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24">
                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Your trust is our foundation. We believe in complete transparency regarding your data.
                    </p>
                    <p className="text-sm text-slate-500">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="prose prose-slate max-w-none space-y-12 bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What Data We Collect</h2>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            We collect the minimum amount of data required to provide a functional and accountable civic reporting service:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700">
                            <li><strong>Account Information:</strong> Name, email address, and optionally your phone number when you register.</li>
                            <li><strong>Report Data:</strong> Photographs of civic issues, text descriptions, and precise geolocation coordinates (GPS) when you drop a pin on the map.</li>
                            <li><strong>Usage Context:</strong> Basic browser telemetry (IP address, user agent) for security, rate-limiting, and fraud prevention purposes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Why It Is Collected & How We Use It</h2>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            Your data is never used for advertising or commercial profiling. It is strictly used to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700">
                            <li>Verify the location and nature of municipal complaints.</li>
                            <li>Route complaints to the correct jurisdictional department.</li>
                            <li>Communicate status updates and resolution proofs back to you.</li>
                            <li>Maintain the integrity of the platform (e.g., calculating Trust Scores to prioritize credible reports).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Who Can Access Your Data</h2>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            <strong>Public Access:</strong> Civic issue locations, categories, and photographs are displayed on our public map. Your personal identifying information (name, email) is <em>never</em> displayed publicly alongside a complaint.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            <strong>Municipal Staff Access:</strong> Verified government authorities and municipal workers handling resolution have access to your contact information solely for the purpose of clarifying complaint details.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Retention Principles</h2>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            We retain account data for as long as your account is active. Records of civic infrastructure complaints—including photos and coordinates—are retained indefinitely as part of the public historical record to analyze systemic municipal issues over time, even after your account is deleted.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Your Rights</h2>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                            <li><strong>Right to Access & Rectify:</strong> You can view and update your personal information via your Profile page at any time.</li>
                            <li><strong>Right to Deletion:</strong> You can request the deletion of your account. Note that this anonymizes your past complaints rather than deleting them from the public infrastructure record.</li>
                            <li><strong>Right to Report:</strong> If you believe your data has been mishandled by a municipal worker on this platform, you may escalate the issue through our Contact Support portal.</li>
                        </ul>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
