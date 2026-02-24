import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Accessibility & Inclusivity | CivicShakti",
    description: "Read our commitment to digital accessibility and inclusive design for all citizens.",
};

export default function AccessibilityPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24">
                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Accessibility & Inclusivity Statement</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Digital public infrastructure must be usable by everyone. We are committed to an inclusive platform.
                    </p>
                </div>

                <div className="prose prose-slate max-w-none space-y-10 bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Commitment</h2>
                        <p className="text-slate-700 leading-relaxed">
                            CivicShakti is dedicated to ensuring digital accessibility for people with disabilities and diverse technological constraints. Civic engagement is a fundamental right, and our platform is designed to minimize barriers to participation. We continually improve the user experience for everyone and apply the relevant accessibility standards.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Design Principles</h2>
                        <ul className="space-y-6">
                            <li>
                                <strong className="block text-slate-900 mb-1 text-lg">1. Mobile-First Optimization</strong>
                                <span className="text-slate-700 leading-relaxed block">
                                    The vast majority of civic reports are made on-the-go. Our application is engineered primarily for mobile devices, ensuring fast load times on low-bandwidth networks (3G) and touch-friendly interfaces that do not require precise dexterity.
                                </span>
                            </li>
                            <li>
                                <strong className="block text-slate-900 mb-1 text-lg">2. Language Simplicity</strong>
                                <span className="text-slate-700 leading-relaxed block">
                                    Bureaucracy is often confusing. We use Plain English standards across all forms, statuses, and notifications to ensure that users with diverse educational backgrounds can understand the process clearly. We actively avoid municipal jargon.
                                </span>
                            </li>
                            <li>
                                <strong className="block text-slate-900 mb-1 text-lg">3. Visual Clarity & Contrast</strong>
                                <span className="text-slate-700 leading-relaxed block">
                                    We adhere to WCAG 2.1 AA standards for color contrast. Important status changes and alerts use both color constraints and icon semantics to communicate meaning to visually impaired and colorblind users. Font sizes are strictly responsive.
                                </span>
                            </li>
                            <li>
                                <strong className="block text-slate-900 mb-1 text-lg">4. Screen Reader Compatibility</strong>
                                <span className="text-slate-700 leading-relaxed block">
                                    Our reporting wizard relies on semantic HTML5 structure, proper ARIA labels for interactive elements, and logical focus management to support users relying on screen reading software.
                                </span>
                            </li>
                        </ul>
                    </section>

                    <section className="bg-slate-50 p-6 rounded-lg border border-slate-100 mt-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-3">Feedback</h2>
                        <p className="text-slate-700 leading-relaxed">
                            We welcome your feedback on the accessibility of CivicShakti. If you encounter accessibility barriers, please contact our support desk at <a href="mailto:accessibility@civicshakti.org" className="text-blue-600 hover:text-blue-800">accessibility@civicshakti.org</a>. We aim to respond to accessibility feedback within 2 business days and actively prioritize these technical fixes.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
