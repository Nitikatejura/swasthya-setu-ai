'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Stethoscope, Lock, User, Eye, EyeOff, AlertCircle, UserPlus, XCircle, ShieldCheck, HeartPulse, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [rejectedMsg, setRejectedMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRejectedMsg('');
    setLoading(true);

    try {
      const user = await login(usernameOrEmail, password);
      if (user.requires_password_change) {
        window.location.href = '/change-password';
      } else {
        if (user.role === 'Admin') window.location.href = '/dashboard/admin';
        else if (user.role === 'Doctor') window.location.href = '/dashboard/doctor';
        else window.location.href = '/dashboard/worker';
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Login failed. Please verify credentials.';
      if (typeof detail === 'string' && detail.startsWith('PENDING:')) {
        router.push('/pending-approval');
      } else if (typeof detail === 'string' && detail.startsWith('REJECTED:')) {
        setRejectedMsg(detail.replace('REJECTED:', '').trim());
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      {/* Left Clinical Feature Showcase Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:flex flex-col justify-between bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-8 rounded-3xl min-h-[520px] shadow-2xl relative overflow-hidden"
      >
        <div className="space-y-4 relative z-10">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-tight">
            {t('integrated_cdss')}
          </h2>
          <p className="text-xs text-teal-100 leading-relaxed">
            {t('integrated_cdss_desc')}
          </p>
        </div>

        <div className="space-y-3 relative z-10 text-xs">
          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t('det_triage_feature')}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{t('emergency_alert_feature')}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
            <span>{t('offline_sync_feature')}</span>
          </div>
        </div>

        <div className="text-[11px] text-teal-200/80 pt-4 border-t border-white/10 relative z-10 font-medium">
          SwasthyaSetu AI Platform &bull; HIPAA Compliant
        </div>
      </motion.div>

      {/* Right Glassmorphism Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-600 dark:bg-teal-500 rounded-2xl text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-600/20 font-bold md:hidden">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('app_title')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('login_subtitle')}</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3.5 rounded-2xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {rejectedMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 p-4 rounded-2xl text-xs space-y-1.5 text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Registration Request Rejected</span>
            </div>
            <p className="font-mono text-[11px] bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-rose-200 dark:border-rose-800">{rejectedMsg}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              Please contact your hospital administrator at <strong>admin@swasthyasetu.org</strong> to appeal.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">User ID or Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. dr_smith or doctor@swasthyasetu.org"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{t('password')}</label>
              <Link href="/forgot-password" className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline">
                {t('forgot_password_link')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password_placeholder')}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span>{t('remember_me')}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-bold py-3.5 rounded-2xl transition text-xs shadow-lg shadow-teal-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <span>{t('login_btn')}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('first_time_user')}{' '}
            <Link href="/signup" className="font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 inline" /> {t('signup_register_link')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
