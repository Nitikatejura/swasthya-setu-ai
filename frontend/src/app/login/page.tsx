'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { Stethoscope, Lock, User, Eye, EyeOff, AlertCircle, UserPlus, Clock, XCircle } from 'lucide-react';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20 font-bold">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('app_title')}</h2>
        <p className="text-xs text-slate-500">{t('login_subtitle')}</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {rejectedMsg && (
        <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl text-xs space-y-1.5 text-rose-900">
          <div className="flex items-center gap-1.5 font-bold text-rose-700">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Registration Request Rejected</span>
          </div>
          <p className="font-mono text-[11px] bg-white/80 p-2 rounded border border-rose-200">{rejectedMsg}</p>
          <p className="text-[11px] text-slate-600 pt-1">
            Please contact your hospital administrator at <strong>admin@swasthyasetu.org</strong> to appeal this decision.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('username')}</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder={t('username_placeholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-700">{t('password')}</label>
            <Link href="/forgot-password" className="text-[11px] font-bold text-emerald-600 hover:underline">
              {t('forgot_password_link')}
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password_placeholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition text-xs shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : t('login_btn')}
        </button>
      </form>

      <div className="text-center pt-3 border-t border-slate-100 space-y-2">
        <p className="text-xs text-slate-600">
          {t('first_time_user')}{' '}
          <Link href="/signup" className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1">
            <UserPlus className="w-3.5 h-3.5 inline" /> {t('signup_register_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
