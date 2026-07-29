'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { SUPPORTED_LANGUAGES, useTranslation, LanguageCode } from '@/lib/i18n';
import { Stethoscope, LogOut, Wifi, WifiOff, RefreshCw, Languages, UserPlus, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar({ lang: propLang, setLang: propSetLang }: { lang?: string; setLang?: (l: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOnline, isSyncing, pendingCount, triggerSync } = useOfflineSync();
  const { lang, setLang, t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = (code: string) => {
    setLang(code as LanguageCode);
    if (propSetLang) propSetLang(code);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'Admin') return '/dashboard/admin';
    if (user.role === 'Doctor') return '/dashboard/doctor';
    return '/dashboard/worker';
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/pending-approval';

  return (
    <nav className="bg-white text-slate-900 border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white font-bold flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <Link href="/" className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                {t('app_title')} <span className="text-emerald-700 text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-bold">AI CDSS</span>
              </Link>
              <p className="text-xs text-slate-500 hidden sm:block">{t('tagline')}</p>
            </div>
          </div>

          {/* Controls & Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Online / Offline Sync Badge */}
            {mounted && (
              <button
                onClick={triggerSync}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
                title="Click to Sync Now"
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
                {pendingCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                    {pendingCount}
                  </span>
                )}
                {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 ml-1" />}
              </button>
            )}

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm">
              <Languages className="w-4 h-4 text-emerald-600" />
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-white text-slate-900 font-sans">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* User Navigation Links (Only on App / Dashboard pages) */}
            {mounted && user && !isAuthPage ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <Link
                  href={getDashboardLink()}
                  className="px-3 py-1.5 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>{t('dashboard')}</span>
                </Link>

                <div className="hidden sm:block text-right pl-2 border-l border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.full_name}</p>
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">{user.role}</p>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : mounted ? (
              <div className="flex items-center gap-2">
                {pathname !== '/login' && (
                  <Link
                    href="/login"
                    className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
                  >
                    {t('login')}
                  </Link>
                )}
                {pathname !== '/signup' && (
                  <Link
                    href="/signup"
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t('signup')}</span>
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
