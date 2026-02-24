import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Frequently Asked Questions | CivicShakti",
    description: "Find answers to common questions about reporting local infrastructure issues.",
};

export default function FAQPage() {
    const faqs = [
        {
            q: "Who can submit complaints?",
            a: "Any resident can submit a complaint. You will need to create a free citizen account, which helps us prevent spam and allows you to track your issues. We also accept basic anonymous reports, but these lack timeline tracking features."
        },
        {
            q: "Is my identity protected?",
            a: "Yes. While you are required to log in to prevent misuse, your personal identity (name, email) is generally kept confidential from the public issue map. Municipal staff handle your data under strict data privacy regulations."
        },
        {
            q: "How long does resolution typically take?",
            a: "Resolution times depend entirely on the severity of the issue and the municipal department's current workload. Critical safety issues (like open manholes) are prioritized over cosmetic maintenance. You can track your issue's status in real-time."
        },
        {
            q: "What types of issues are supported?",
            a: "We currently accept reports for civic infrastructure: potholes, broken streetlights, illegal dumping/waste accumulation, water leakage, and public property damage. We do not handle emergency police or fire services."
        },
        {
            q: "What happens if my complaint is rejected?",
            a: "Complaints may be rejected if they are duplicates, outside municipal jurisdiction, or lack sufficient photographic evidence. If rejected, you will receive a specific reason from the staff and can resubmit with better evidence."
        },
        {
            q: "How do you prevent misuse of the platform?",
            a: "We utilize our AI validation pipeline to review uploaded images against the stated category. We also enforce rate-limits and calculate 'Trust Scores' for users. Serial submission of false reports leads to automated account suspension."
        },
        {
            q: "Can I track the progress?",
            a: "Absolutely. Every complaint generates a unique Tracking ID. Enter this ID on our Tracking page, or view it from your Dashboard, to see a timeline of every action taken by the municipal staff."
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16 md:py-24">
                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Clear answers to common questions regarding accountability, privacy, and process.
                    </p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{faq.q}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-blue-50 border border-blue-100 p-8 rounded-xl text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Still have questions?</h3>
                    <p className="text-slate-600 mb-6">
                        If you need further assistance or have an inquiry not listed here, please contact our support desk.
                    </p>
                    <a href="/contact" className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
                        Contact Support
                    </a>
                </div>
            </main>

            <Footer />
        </div>
    );
}
