"use client";

import Link from "next/link";
import {
  ArrowRight, Search, ShieldAlert, Camera, BarChart3,
  MapPin, Clock, Shield, Users, Zap, TrendingUp, CheckCircle2,
  Brain, Timer, Image as ImageIcon, Map as MapIcon, ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

const FEATURES = [
  { key: "feat1", icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
  { key: "feat2", icon: Brain, color: "bg-violet-100 text-violet-600" },
  { key: "feat3", icon: Timer, color: "bg-rose-100 text-rose-600" },
  { key: "feat4", icon: ImageIcon, color: "bg-amber-100 text-amber-600" },
  { key: "feat5", icon: MapIcon, color: "bg-emerald-100 text-emerald-600" },
  { key: "feat6", icon: ThumbsUp, color: "bg-indigo-100 text-indigo-600" },
];

const STEPS = [
  { key: "step1", icon: Camera, num: "01", color: "from-amber-500 to-orange-500" },
  { key: "step2", icon: BarChart3, num: "02", color: "from-blue-500 to-indigo-500" },
  { key: "step3", icon: CheckCircle2, num: "03", color: "from-emerald-500 to-teal-500" },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-white relative overflow-hidden">
      <PublicHeader />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-6 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-50 via-indigo-50/50 to-transparent rounded-full blur-3xl -z-10 opacity-70" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-gradient-to-l from-amber-50 to-transparent rounded-full blur-3xl -z-10 opacity-50" />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700 mb-4">
            <Shield className="w-4 h-4" />
            <span>Transparent. Accountable. Citizen-First.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-slate-900">{t("landing.heroTitle1")} </span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t("landing.heroTitle2")}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/report">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 h-14 px-8 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30">
                {t("landing.reportBtn")} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <MapPin className="w-5 h-5 text-blue-600" /> {t("landing.exploreBtn")}
              </Button>
            </Link>
            <Link href="/track">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <Search className="w-5 h-5 text-slate-500" /> {t("landing.trackBtn")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: "500+", label: t("landing.statComplaints"), icon: Zap },
            { value: "320+", label: t("landing.statResolved"), icon: CheckCircle2 },
            { value: "50+", label: t("landing.statAreas"), icon: MapPin },
            { value: "< 48h", label: t("landing.statResponseTime"), icon: Clock },
          ].map((stat, i) => (
            <div key={i} className="text-center p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <stat.icon className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {t("nav.howItWorks")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (desktop) */}
            <div className="absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-amber-300 via-blue-300 to-emerald-300 hidden md:block" />

            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative">
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Step {step.num}</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-2 mb-3">{t(`landing.${step.key}Title`)}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">{t(`landing.${step.key}Desc`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{t("landing.featuresTitle")}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="group p-6 rounded-2xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/30 transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <div className={`w-12 h-12 rounded-xl ${feat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{t(`landing.${feat.key}Title`)}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{t(`landing.${feat.key}Desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
            {t("landing.ctaSubtitle")}
          </p>
          <Link href="/report">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-10 text-lg rounded-xl font-bold shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl gap-2">
              {t("landing.ctaBtn")} <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
