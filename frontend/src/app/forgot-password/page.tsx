'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Mail, User, KeyRound, ArrowLeft, CheckCircle2, Building, ShieldAlert } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20 font-bold">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Password Assistance</h2>
        <p className="text-xs text-slate-500">Recover access to your SwasthyaSetu AI account</p>
      </div>

      {submitted ? (
        <div className="space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Reset Request Submitted</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              If an account matching <strong>"{usernameOrEmail}"</strong> exists in our system, reset instructions have been dispatched.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-600" /> Need Immediate Admin Assistance?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              For rural clinic staff, your District Hospital Administrator can reset your password directly from the Admin Panel.
            </p>
            <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-800">
              Email: admin@swasthyasetu.org | Phone: +91 98765 00001
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Enter Username or Registered Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. dr_smith or nurse_asha@swasthyasetu.org"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition text-xs shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? 'Sending Request...' : 'Send Password Reset Request'}
          </button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-800 font-bold inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
