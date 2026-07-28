'use client';
import './globals.css';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { OfflineBanner } from '@/components/OfflineBanner';
import { LanguageProvider, useTranslation } from '@/lib/i18n';

const queryClient = new QueryClient();

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useTranslation();

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />
      <OfflineBanner />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 text-center py-4 text-xs text-slate-600 shadow-sm">
        SwasthyaSetu AI &copy; 2026 &bull; {t('disclaimer')}
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
    <html lang="gu" className="light" suppressHydrationWarning>
      <head>
        <title>SwasthyaSetu AI - Rural Healthcare CDSS</title>
        <meta name="description" content="Offline-first AI-assisted Clinical Decision Support System for Rural Healthcare" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <MainLayoutContent>{children}</MainLayoutContent>
          </LanguageProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
