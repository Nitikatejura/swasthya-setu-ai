'use client';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Clock, ArrowLeft, Mail, Phone, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PendingApprovalPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl space-y-6 text-center">
      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-3xl text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
        <Clock className="w-8 h-8 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('pending_approval_title')}</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          {t('pending_approval_msg')}
        </p>
      </div>

      <div className="p-5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-left space-y-3 text-xs">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Account Verification Protocol
        </h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          To ensure clinical safety and data integrity, all medical officer and healthcare worker accounts must be verified by a system administrator before login access is granted.
        </p>
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> Support: admin@swasthyasetu.org</p>
          <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Helpline: +91 98765 00001</p>
        </div>
      </div>

      <div className="pt-2">
        <Link
          href="/login"
          className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/30 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t('login')}
        </Link>
      </div>
    </div>
  );
}
