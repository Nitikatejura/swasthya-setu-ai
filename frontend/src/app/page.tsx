'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Stethoscope, HeartPulse, Activity, UserCheck, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-[82vh] flex flex-col justify-between items-center py-6 sm:py-10">
      {/* Main Container: Exact Homepage Card Layout Requested */}
      <main className="max-w-4xl w-full mx-auto px-4 flex flex-col items-center justify-center my-auto space-y-8 text-center">

        {/* Large Rounded Healthcare Clinic Visual Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl rounded-[32px] p-3 sm:p-4 bg-[#E6F7F4] dark:bg-slate-900 border-2 border-[#BFEBE3] dark:border-slate-800 shadow-xl overflow-hidden"
        >
          <div className="relative w-full rounded-[24px] overflow-hidden bg-white dark:bg-slate-950 flex flex-col items-center justify-between p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
            
            {/* Top Clinic Badges */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 bg-[#E6F7F4] dark:bg-teal-950/80 border border-[#BFEBE3] dark:border-teal-800 px-4 py-1.5 rounded-full text-xs font-bold text-[#0F766E] dark:text-teal-300">
                <Stethoscope className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400" />
                <span>Primary Health Care Center & Digital Clinic</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] dark:text-teal-300 bg-[#E6F7F4] dark:bg-teal-950/60 px-3.5 py-1.5 rounded-full border border-[#BFEBE3] dark:border-teal-800">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Clinical Triage Station</span>
              </div>
            </div>

            {/* Three Center Clinical Cards */}
            <div className="w-full py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center max-w-2xl mx-auto">
                {/* Left Card: Healthcare Worker */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Healthcare Worker</h4>
                    <p className="text-[10px] text-[#0F766E] dark:text-teal-400 font-semibold">ASHA / PHC Nurse</p>
                  </div>
                </div>

                {/* Center Card: Vitals & Symptoms */}
                <div className="bg-[#0F766E] text-white p-5 rounded-2xl shadow-lg border border-teal-700 text-center space-y-2 transform sm:scale-105">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-teal-100 block">DIGITAL PATIENT INTAKE</span>
                  <div className="flex justify-center items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-300 animate-pulse" />
                    <span className="text-sm font-black tracking-tight">Vitals & Symptoms</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/15 p-1.5 rounded-xl border border-white/20">
                    <span>SpO₂: 98%</span>
                    <span>BP: 120/80</span>
                  </div>
                </div>

                {/* Right Card: Patient Consultation */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Patient Consultation</h4>
                    <p className="text-[10px] text-[#0F766E] dark:text-teal-400 font-semibold">Village Health Record</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Subtitles */}
            <div className="w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Smart Triage & Clinical Decision Support</span>
              <span>Rural Health Center Assistance</span>
            </div>

          </div>
        </motion.div>

        {/* Get Started Button */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Link
              href="/signup"
              className="px-10 py-3.5 bg-[#0F766E] hover:bg-[#0D655E] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#0F766E]/25 inline-flex items-center gap-2.5 transition transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        )}
      </main>

      {/* Minimal Single Line Copyright */}
      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
        © 2026 SwasthyaSetu AI
      </footer>
    </div>
  );
}
