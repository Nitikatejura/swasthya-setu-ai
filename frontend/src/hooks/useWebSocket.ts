import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export function useWebSocket(onRedAlert?: (alertData: any) => void) {
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);

  const playEmergencySound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Play 3 rapid emergency warning beeps
      [0, 0.25, 0.5].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay); // A5 pitch
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'Doctor') return;

    const wsUrl = `ws://localhost:8000/api/v1/ws/notifications/${user.id}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      // Send periodic heartbeat ping
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send('ping');
        }
      }, 20000);
      (socket as any)._pingInterval = pingInterval;
    };

    socket.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'RED_ALERT') {
          playEmergencySound();
          if (onRedAlert) {
            onRedAlert(payload);
          }
        }
      } catch (e) {}
    };

    return () => {
      if ((socket as any)._pingInterval) {
        clearInterval((socket as any)._pingInterval);
      }
      socket.close();
    };
  }, [user, onRedAlert]);

  return {
    socket: socketRef.current
  };
}
