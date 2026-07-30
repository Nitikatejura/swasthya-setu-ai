'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, User, KeyRound, ArrowLeft, CheckCircle2, Building } from 'lucide-react';
import { motion } from 'framer-motion';

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
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-teal-600 dark:bg-teal-500 rounded-2xl text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-600/20 font-bold">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Password Assistance</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Recover access to your SwasthyaSetu AI account</p>
      </div>

      {submitted ? (
        <div className="space-y-4 text-xs">
          <div className="bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 p-4 rounded-2xl text-teal-900 dark:text-teal-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-300">
              <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Reset Request Submitted</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              If an account matching <strong>"{usernameOrEmail}"</strong> exists in our system, reset instructions have been dispatched.
            </p>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-4 rounded-2xl space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Need Immediate Admin Assistance?
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              For rural clinic staff, your District Hospital Administrator can reset your password directly from the Admin Panel.
            </p>
            <p className="font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              Email: admin@swasthyasetu.org | Phone: +91 98765 00001
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Enter Username or Registered Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. dr_smith or nurse_asha@swasthyasetu.org"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-bold py-3.5 rounded-2xl transition text-xs shadow-lg shadow-teal-600/30 disabled:opacity-50"
          >
            {loading ? 'Sending Request...' : 'Send Password Reset Request'}
          </button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 font-bold inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
