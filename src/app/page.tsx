import Link from "next/link";
import { ArrowRight, Search, ShieldAlert, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Graphic */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-50 to-transparent z-0 pointer-events-none" />

      {/* Navbar */}
      <PublicHeader />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative z-10">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Report civic issues in <span className="text-blue-600">under 60 seconds.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
              Potholes, broken streetlights, or waste accumulation? Tell us what&apos;s wrong, and track its resolution in real-time. Transparent, fast, and accountable.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/report" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 h-14 px-8 text-lg rounded-sm shadow-none transition-all hover:-translate-y-1">
                Report an Issue <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link href="/explore" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg rounded-sm border-blue-200 text-blue-700 hover:bg-blue-50">
                <Search className="w-5 h-5" /> Explore Map
              </Button>
            </Link>

            <Link href="/track" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg rounded-sm border-slate-300 text-slate-700 hover:bg-slate-100">
                <Search className="w-5 h-5" /> Track Status
              </Button>
            </Link>
          </div>
        </div>

        {/* Value Props / How it works */}
        <div className="w-full max-w-5xl mx-auto mt-24 grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-8 rounded-sm shadow-none border border-slate-300 place-items-start space-y-4">
            <div className="w-12 h-12 rounded-sm bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">1</div>
            <h3 className="text-xl font-bold text-slate-900">Snap & Report</h3>
            <p className="text-slate-600 leading-relaxed">
              Take a photo, select the category, and drop a pin on the map. It takes less than a minute.
            </p>
          </div>

          <div className="bg-white p-8 rounded-sm shadow-none border border-slate-300 place-items-start space-y-4 relative md:-top-4">
            <div className="w-12 h-12 rounded-sm bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">2</div>
            <h3 className="text-xl font-bold text-slate-900">Track Progress</h3>
            <p className="text-slate-600 leading-relaxed">
              Get a unique ID. Watch as your complaint moves from Submitted to In Progress to Resolved.
            </p>
            <div className="absolute top-1/2 -right-6 hidden md:block text-slate-300">
              <ChevronRight className="w-8 h-8" />
            </div>
            <div className="absolute top-1/2 -left-6 hidden md:block text-slate-300">
              <ChevronRight className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-sm shadow-none border border-slate-300 place-items-start space-y-4">
            <div className="w-12 h-12 rounded-sm bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">3</div>
            <h3 className="text-xl font-bold text-slate-900">See Resolution</h3>
            <p className="text-slate-600 leading-relaxed">
              No black holes. Receive photo-proof once the municipality has fixed the issue.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
