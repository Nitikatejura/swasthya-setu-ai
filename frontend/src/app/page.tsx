'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Stethoscope, ShieldAlert, Cpu, WifiOff, FileCheck, ArrowRight, UserCheck, HeartPulse } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'Admin') router.push('/dashboard/admin');
      else if (user.role === 'Doctor') router.push('/dashboard/doctor');
      else router.push('/dashboard/worker');
    }
  }, [user, loading, router]);

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto py-10">
        <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold">
          <Stethoscope className="w-4 h-4" />
          <span>SwasthyaSetu AI - Phase 14 Final Hackathon Package</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          AI-Powered Rural Healthcare Triage for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Every Village.</span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          An offline-first Clinical Decision Support System (CDSS) empowering ASHA workers & doctors in rural clinics with Gujarati voice symptom collection, evidence-based WHO/NHM triage rules, real-time emergency doctor alerts, and printable QR referrals.
        </p>

        {/* Quick Role Login Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <span>Sign In to System</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 max-w-2xl mx-auto text-left space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> Demo Account Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-bold">Admin</span>
              <p className="text-white font-mono">admin / admin123</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-bold">Doctor</span>
              <p className="text-white font-mono">dr_smith / doctor123</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-bold">Healthcare Worker</span>
              <p className="text-white font-mono">nurse_asha / worker123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
          <div className="p-3 bg-emerald-950 text-emerald-400 rounded-xl w-fit border border-emerald-500/30">
            <WifiOff className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Offline-First Architecture</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full functionality without internet using Dexie.js IndexedDB. Automatic background synchronization with PostgreSQL when connectivity returns.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
          <div className="p-3 bg-teal-950 text-teal-400 rounded-xl w-fit border border-teal-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Multilingual Voice AI</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gujarati, Hindi, and English STT/TTS symptom collection with structured AI summaries powered by Gemini and offline fallback.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
          <div className="p-3 bg-rose-950 text-rose-400 rounded-xl w-fit border border-rose-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Deterministic Rule Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evidence-based WHO & India NHM guideline triage evaluating vitals and red flag symptoms into 🔴 RED, 🟡 YELLOW, and 🟢 GREEN priority.
          </p>
        </div>
      </div>
    </div>
  );
}
