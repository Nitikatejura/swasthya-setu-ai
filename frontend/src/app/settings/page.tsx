'use client';
import { useState } from 'react';
import { Settings, Shield, Globe, Bell, Database, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [syncInterval, setSyncInterval] = useState('30');
  const [defaultGuideline, setDefaultGuideline] = useState('india_nhm');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings & Guidelines</h1>
          <p className="text-xs text-slate-500">Configure offline sync frequencies, WHO/NHM clinical guidelines, and language preferences</p>
        </div>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Return Home
        </Link>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configuration saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" /> Triage Guideline Configuration
          </h2>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">Default Clinical Guideline Engine</label>
            <select
              value={defaultGuideline}
              onChange={(e) => setDefaultGuideline(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white"
            >
              <option value="india_nhm">India National Health Mission (NHM) Rural Triage Guidelines</option>
              <option value="who_mhgap">WHO Emergency Triage Assessment and Treatment (ETAT)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Offline Synchronization Settings
          </h2>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">Background Sync Frequency (Seconds)</label>
            <select
              value={syncInterval}
              onChange={(e) => setSyncInterval(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white"
            >
              <option value="15">Every 15 Seconds (Fast)</option>
              <option value="30">Every 30 Seconds (Default)</option>
              <option value="60">Every 60 Seconds (Bandwidth Saver)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
