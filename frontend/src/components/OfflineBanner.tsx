'use client';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount, triggerSync } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-inner transition ${
        !isOnline
          ? 'bg-amber-500 text-slate-950'
          : 'bg-emerald-600 text-white'
      }`}
    >
      <div className="flex items-center space-x-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>
              <strong>Offline Mode Active:</strong> All patient registrations, symptoms & vitals are saved safely in IndexedDB. ({pendingCount} pending changes)
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>Online connection restored. Synchronizing pending records...</span>
          </>
        )}
      </div>

      {isOnline && (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="bg-slate-950 text-white px-2.5 py-1 rounded font-bold hover:bg-slate-900 flex items-center gap-1 transition"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
}
