'use client';
import './globals.css';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { OfflineBanner } from '@/components/OfflineBanner';
import { LanguageProvider, useTranslation } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

const queryClient = new QueryClient();

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useTranslation();

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />
      <OfflineBanner />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 transition-colors duration-200">
        {children}
      </main>
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs py-8 px-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-600 rounded-lg text-white font-bold flex items-center justify-center shadow-sm">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 dark:text-white tracking-tight text-sm">SwasthyaSetu AI</span>
            <span className="text-slate-400 dark:text-slate-500 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs font-medium">
              {t('sub_logo_tag')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-600 dark:text-slate-300">
            <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition">{t('privacy_policy')}</Link>
            <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition">{t('terms_of_service')}</Link>
            <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition">{t('contact')}</Link>
            <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition">{t('help_center')}</Link>
          </div>

          <div className="text-slate-500 dark:text-slate-500 text-[11px] font-medium">
            {t('disclaimer')}
          </div>
        </div>
      </footer>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <html lang="gu" suppressHydrationWarning>
      <head>
        <title>SwasthyaSetu AI - Smart Clinical Triage & Healthcare Platform</title>
        <meta name="description" content="Enterprise AI Clinical Triage and Intelligent Patient Decision Platform" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F766E" />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-200" suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <MainLayoutContent>{children}</MainLayoutContent>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
