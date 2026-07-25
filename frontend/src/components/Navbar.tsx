'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { SUPPORTED_LANGUAGES, getTranslation } from '@/lib/i18n';
import { Stethoscope, User, LogOut, Wifi, WifiOff, RefreshCw, Languages, Bell } from 'lucide-react';
import { useState } from 'react';

export function Navbar({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const { user, logout } = useAuth();
  const { isOnline, isSyncing, pendingCount, triggerSync } = useOfflineSync();

  return (
    <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500 rounded-lg text-slate-950 font-bold flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <Link href="/" className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                SwasthyaSetu <span className="text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">AI CDSS</span>
              </Link>
              <p className="text-xs text-slate-400 hidden sm:block">AI-Powered Rural Triage for Every Village</p>
            </div>
          </div>

          {/* Controls & User Profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Online / Offline Sync Badge */}
            <button
              onClick={triggerSync}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900'
              }`}
              title="Click to Sync Now"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline</span>
                </>
              )}
              {pendingCount > 0 && (
                <span className="ml-1 bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400 ml-1" />}
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
              <Languages className="w-4 h-4 text-emerald-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* User Dropdown / Login */}
            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-slate-200">{user.full_name}</p>
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-lg transition"
              >
                {getTranslation(lang, 'login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
