'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { SUPPORTED_LANGUAGES, useTranslation, LanguageCode } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Stethoscope, LogOut, Wifi, WifiOff, RefreshCw, Languages, UserPlus, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar({ lang: propLang, setLang: propSetLang }: { lang?: string; setLang?: (l: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOnline, isSyncing, pendingCount, triggerSync } = useOfflineSync();
  const { lang, setLang, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

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
    <nav className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800 shadow-sm sticky top-0 z-40 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-600 dark:bg-teal-500 rounded-xl text-white font-bold flex items-center justify-center shadow-md shadow-teal-600/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <Link href="/" className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                SwasthyaSetu AI <span className="text-teal-700 dark:text-teal-300 text-xs px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 font-bold">{t('smart_triage_badge')}</span>
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{t('sub_logo_tag')}</p>
            </div>
          </div>

          {/* Controls & Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Network Sync Badge */}
            {mounted && (
              <button
                onClick={triggerSync}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  isOnline
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                }`}
                title="Click to Sync Now"
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span className="hidden sm:inline">{t('online_badge')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="hidden sm:inline">{t('offline_badge')}</span>
                  </>
                )}
                {pendingCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                    {pendingCount}
                  </span>
                )}
                {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-teal-600 ml-1" />}
              </button>
            )}

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Languages className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark / Light Mode Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-800"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            {/* User Navigation Links */}
            {mounted && user && !isAuthPage ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  href={getDashboardLink()}
                  className="px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                >
                  <LayoutDashboard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{t('dashboard')}</span>
                </Link>

                <div className="hidden sm:block text-right pl-2 border-l border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user.full_name}</p>
                  <p className="text-[10px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">{user.role}</p>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
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
                    className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-400 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {t('login')}
                  </Link>
                )}
                {pathname !== '/signup' && (
                  <Link
                    href="/signup"
                    className="text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1"
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
