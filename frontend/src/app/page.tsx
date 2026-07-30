'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Stethoscope, ShieldAlert, Cpu, WifiOff, ArrowRight, UserPlus,
  Activity, Bell, Globe, FileText, CheckCircle2, ShieldCheck, HeartPulse,
  Award, Clock, Building2, PhoneCall, Mail, MapPin, Star, Users, ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (!loading && user) {
      if (user.role === 'Admin') router.push('/dashboard/admin');
      else if (user.role === 'Doctor') router.push('/dashboard/doctor');
      else router.push('/dashboard/worker');
    }
  }, [user, loading, router]);

  const features = [
    {
      icon: Activity,
      title: 'Smart Clinical Triage Engine',
      desc: 'Standardized WHO and India NHM evidence-based triage protocols prioritizing critical cases automatically.',
      color: 'from-teal-500 to-emerald-600'
    },
    {
      icon: HeartPulse,
      title: 'Real-Time Emergency Alerts',
      desc: 'Instant WebSocket notifications dispatching acute cardiac and hypoxemic alerts directly to medical officers.',
      color: 'from-rose-500 to-red-600'
    },
    {
      icon: Globe,
      title: 'Regional Language Support',
      desc: 'Multilingual symptom intake and AI clinical assistant in Gujarati, Hindi, English, and regional dialects.',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: FileText,
      title: 'Digital Patient Records & QR',
      desc: 'Complete encounter histories, vital trends, and printable A4 QR referral passes for seamless hospital transfers.',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      icon: WifiOff,
      title: 'Field-Resilient Sync Architecture',
      desc: 'Uninterrupted clinical workflows in remote rural clinics with automatic background data synchronization.',
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security & Compliance',
      desc: 'Role-based access control, HIPAA security protocols, and encrypted clinical audit logs for complete data safety.',
      color: 'from-emerald-500 to-teal-700'
    }
  ];

  const stats = [
    { label: 'Patients Screened', value: '12,450+', sub: 'Across Primary Health Centers' },
    { label: 'Emergency Transfers', value: '1,280+', sub: 'Immediate Medical Reviews' },
    { label: 'Active Clinicians', value: '450+', sub: 'Doctors & ASHA Workers' },
    { label: 'Healthcare Centers', value: '120+', sub: 'District Health Network' }
  ];

  const workflowSteps = [
    { num: '01', title: 'Patient Registration', desc: 'Fast digital intake & QR pass creation' },
    { num: '02', title: 'Symptom Collection', desc: 'Multilingual conversational interview' },
    { num: '03', title: 'Vital Signs Entry', desc: 'SpO2, BP, Temp, Pulse & Resp rate' },
    { num: '04', title: 'Protocol Evaluation', desc: 'Deterministic clinical rule engine' },
    { num: '05', title: 'Doctor Notification', desc: 'Real-time alert for emergency cases' },
    { num: '06', title: 'Specialist Referral', desc: 'Digital QR transfer pass generation' }
  ];

  const benefits = [
    { title: 'Zero Care Delays', desc: 'Immediate priority flags ensure life-threatening emergencies receive rapid medical attention.', icon: Clock },
    { title: 'Standardized Care Protocols', desc: 'Eliminate subjective guesswork with consistent evidence-based WHO guidelines.', icon: Award },
    { title: 'Seamless Rural Operations', desc: 'Designed specifically to function continuously regardless of intermittent network connectivity.', icon: Building2 }
  ];

  const testimonials = [
    {
      name: 'Dr. Rajesh Patel',
      role: 'Chief Medical Officer, Anand District Hospital',
      quote: 'SwasthyaSetu AI has transformed how our emergency department receives referrals from village clinics. RED alerts notify us before the ambulance even arrives.',
      stars: 5
    },
    {
      name: 'Priya Ben',
      role: 'Senior ASHA Supervisor, Mogri PHC',
      quote: 'The Gujarati voice symptom collection allows our field workers to conduct comprehensive assessments effortlessly in remote villages.',
      stars: 5
    },
    {
      name: 'Dr. Anjali Mehta',
      role: 'Consultant Pediatrician, Vadodara Civil Hospital',
      quote: 'The printable QR referral passes make admission instantaneous. Patient history and vital trends are instantly visible with one scan.',
      stars: 5
    }
  ];

  return (
    <div className="space-y-20 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 rounded-3xl bg-gradient-to-b from-teal-50/60 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-12 text-center shadow-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-teal-100/80 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
            <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Next-Generation Healthcare Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Transforming Rural Triage & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-600 to-blue-600">
              Clinical Decision Support
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            An integrated digital health platform empowering clinicians and healthcare workers with standardized triage protocols, real-time emergency alert networks, and digital patient history tracking.
          </p>

          {/* Action CTA Buttons */}
          {mounted && (
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/login"
                className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/30 flex items-center gap-2 transition transform hover:-translate-y-0.5 text-sm"
              >
                <span>Sign In to Clinical Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/signup"
                className="px-8 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl shadow-sm flex items-center gap-2 transition text-sm"
              >
                <UserPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Register User Account</span>
              </Link>
            </div>
          )}
        </motion.div>
      </section>

      {/* Statistics Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((st, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl text-center space-y-1 shadow-sm"
          >
            <strong className="text-3xl sm:text-4xl font-black text-teal-600 dark:text-teal-400 block">{st.value}</strong>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{st.label}</span>
            <span className="text-[11px] text-slate-400 block">{st.sub}</span>
          </motion.div>
        ))}
      </section>

      {/* Features Grid */}
      <section className="space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Platform Capabilities</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Enterprise-grade tools engineered for primary healthcare centers and district hospitals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-3.5 shadow-sm hover:shadow-lg transition group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${feat.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">{feat.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 rounded-3xl space-y-10 shadow-sm">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Clinical Workflow Process</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Standardized multi-tier triage protocol connecting field workers to hospital specialists.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {workflowSteps.map((wf, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-5 rounded-2xl space-y-2 text-center flex flex-col justify-between">
              <span className="text-xs font-mono font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800 w-fit mx-auto">{wf.num}</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{wf.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{wf.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why SwasthyaSetu AI / Benefits */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Why Healthcare Networks Choose SwasthyaSetu AI</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{b.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Trusted by Medical Professionals</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(t.stars)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">"{t.quote}"</p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">{t.name}</strong>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium block">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-r from-teal-700 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-black tracking-tight">Need Enterprise Deployment Support?</h2>
          <p className="text-xs text-teal-100 leading-relaxed max-w-md">
            Our clinical operations team is available 24/7 to assist district health departments and hospital networks with onboarding and system integration.
          </p>
          <div className="space-y-2 text-xs text-teal-100 pt-2">
            <p className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-teal-300" /> Helpline: +91 98765 00001</p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-teal-300" /> Email: support@swasthyasetu.org</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-300" /> Headquarters: Anand District Health Network, Gujarat</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 space-y-3 text-slate-900">
          <h3 className="text-sm font-bold text-white">Contact Clinical Operations</h3>
          <input
            type="text"
            placeholder="Your Name / Facility Name"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="email"
            placeholder="Email Address"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="button"
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition shadow-md"
          >
            Submit Inquiry
          </button>
        </div>
      </section>
    </div>
  );
}
