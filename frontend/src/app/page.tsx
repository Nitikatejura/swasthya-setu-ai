'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Stethoscope, ShieldAlert, Cpu, WifiOff, ArrowRight, UserCheck, UserPlus } from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (!loading && user) {
      if (user.role === 'Admin') router.push('/dashboard/admin');
      else if (user.role === 'Doctor') router.push('/dashboard/doctor');
      else router.push('/dashboard/worker');
    }
  }, [user, loading, router]);

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto py-8">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
          <Stethoscope className="w-4 h-4 text-emerald-600" />
          <span>SwasthyaSetu AI - Clinical Decision Support System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight">
          AI-Powered Rural Healthcare Triage for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Every Village.</span>
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          An offline-first Clinical Decision Support System (CDSS) empowering ASHA workers & doctors in rural clinics with Gujarati voice symptom collection, evidence-based WHO/NHM triage rules, real-time emergency doctor alerts, and printable QR referrals.
        </p>

        {/* Action Buttons: Sign In & First-Time Sign Up */}
        {mounted && (
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <span>Sign In to System</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/signup"
              className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl shadow-sm flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>First-Time User? Sign Up</span>
            </Link>
          </div>
        )}

        {/* Demo Credentials Box */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 max-w-2xl mx-auto text-left space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" /> Quick Demo Accounts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block font-bold">Admin</span>
              <p className="text-slate-900 font-mono font-bold">admin / admin123</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block font-bold">Doctor</span>
              <p className="text-slate-900 font-mono font-bold">dr_smith / doctor123</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block font-bold">Healthcare Worker</span>
              <p className="text-slate-900 font-mono font-bold">nurse_asha / worker123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl w-fit border border-emerald-200">
            <WifiOff className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Offline-First Architecture</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full functionality without internet using Dexie.js IndexedDB. Automatic background synchronization with PostgreSQL when connectivity returns.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl w-fit border border-teal-200">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Multilingual Voice AI</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gujarati, Hindi, and English STT/TTS symptom collection with structured AI summaries powered by Gemini and offline fallback.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl w-fit border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Deterministic Rule Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Evidence-based WHO & India NHM guideline triage evaluating vitals and red flag symptoms into 🔴 RED, 🟡 YELLOW, and 🟢 GREEN priority.
          </p>
        </div>
      </div>
    </div>
  );
}
