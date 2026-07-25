'use client';
import './globals.css';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { OfflineBanner } from '@/components/OfflineBanner';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState('gu');

  return (
    <html lang={lang} className="dark">
      <head>
        <title>SwasthyaSetu AI - Rural Healthcare CDSS</title>
        <meta name="description" content="Offline-first AI-assisted Clinical Decision Support System for Rural Healthcare" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#090d16" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
        <QueryClientProvider client={queryClient}>
          <Navbar lang={lang} setLang={setLang} />
          <OfflineBanner />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="bg-slate-900 border-t border-slate-800 text-center py-4 text-xs text-slate-500">
            SwasthyaSetu AI &copy; 2026 &bull; Offline-First Clinical Decision Support System &bull; CDSS Disclaimer Applied
          </footer>
        </QueryClientProvider>
      </body>
    </html>
  );
}
