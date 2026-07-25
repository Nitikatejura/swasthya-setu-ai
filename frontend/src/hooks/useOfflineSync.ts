'use client';
import { useState, useEffect } from 'react';
import { offlineDb, SyncQueueItem } from '@/db/offlineDb';
import { apiClient } from '@/lib/api';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const updatePendingCount = async () => {
    try {
      const count = await offlineDb.syncQueue.where('status').equals('PENDING').count();
      setPendingCount(count);
    } catch (e) {}
  };

  useEffect(() => {
    updatePendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const items = await offlineDb.syncQueue.where('status').equals('PENDING').toArray();
      if (items.length > 0) {
        const payloadItems = items.map((item) => ({
          queue_id: item.queue_id,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          operation: item.operation,
          payload: item.payload,
          timestamp: item.timestamp,
        }));

        const res = await apiClient.post('/sync/upload', { items: payloadItems });
        const { processed_queue_ids } = res.data;

        if (processed_queue_ids && processed_queue_ids.length > 0) {
          await offlineDb.syncQueue.where('queue_id').anyOf(processed_queue_ids).delete();
        }
      }

      // Sync down latest records from server
      const downRes = await apiClient.get('/sync/download');
      if (downRes.data) {
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Background sync failed:', e);
    } finally {
      setIsSyncing(false);
      updatePendingCount();
    }
  };

  const queueOfflineAction = async (
    entity_type: SyncQueueItem['entity_type'],
    entity_id: string,
    operation: SyncQueueItem['operation'],
    payload: any
  ) => {
    const queue_id = `Q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await offlineDb.syncQueue.add({
      queue_id,
      entity_type,
      entity_id,
      operation,
      payload,
      status: 'PENDING',
      retry_count: 0,
      timestamp: new Date().toISOString(),
    });
    updatePendingCount();

    if (navigator.onLine) {
      triggerSync();
    }
  };

  return { isOnline, isSyncing, pendingCount, lastSyncTime, triggerSync, queueOfflineAction };
}
