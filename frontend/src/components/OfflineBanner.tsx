'use client';
import { useState, useEffect } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { WifiOff, RefreshCw, CheckCircle2, SignalLow, Clock } from 'lucide-react';

export function OfflineBanner() {
  const [mounted, setMounted] = useState(false);
  const { isOnline, isSyncing, pendingCount, lastSyncTime, connectionQuality, triggerSync } = useOfflineSync();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (isOnline && connectionQuality === 'fast' && pendingCount === 0) return null;

  return (
    <div
      className={`px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-inner transition ${
        !isOnline
          ? 'bg-amber-500 text-slate-950'
          : connectionQuality === 'slow'
          ? 'bg-orange-500 text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      <div className="flex items-center space-x-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-slate-950 animate-pulse shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> All patient registrations, symptoms & vitals are saved safely in IndexedDB. ({pendingCount} pending changes)
            </span>
          </>
        ) : connectionQuality === 'slow' ? (
          <>
            <SignalLow className="w-4 h-4 text-white animate-pulse shrink-0" />
            <span>
              <strong>Slow Rural Network (2G/3G Detected):</strong> Low-bandwidth mode active. Priority RED emergency queue active.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Online connection restored. Synchronizing records...</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {lastSyncTime && (
          <span className="hidden md:flex items-center gap-1 text-[11px] opacity-90 font-mono">
            <Clock className="w-3 h-3 inline" /> Last Sync: {lastSyncTime}
          </span>
        )}

        {isOnline && (
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="bg-slate-900 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-1 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
