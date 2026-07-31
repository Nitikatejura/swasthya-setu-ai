'use client';
import { useState, useEffect, useRef } from 'react';

export function useVoice(langCode: string = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const MAX_DURATION_SECONDS = 120; // 120 seconds (02:00)

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSupported(true);
    }
  }, []);

  const startListening = () => {
    if (!supported) return;
    stopListening(); // Reset any existing active session

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;

    const langMap: Record<string, string> = {
      gu: 'gu-IN',
      hi: 'hi-IN',
      en: 'en-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      bn: 'bn-IN',
    };
    recognition.lang = langMap[langCode] || 'en-IN';

    setRecordingSeconds(0);

    recognition.onstart = () => {
      setIsListening(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= MAX_DURATION_SECONDS - 1) {
            stopListening();
            return MAX_DURATION_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    };

    recognition.onresult = (event: any) => {
      let finalStr = '';
      for (let i = 0; i < event.results.length; i++) {
        finalStr += event.results[i][0].transcript + ' ';
      }
      setTranscript(finalStr.trim());
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => stopListening();

    try {
      recognition.start();
    } catch (e) {
      stopListening();
    }
  };

  const stopListening = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<string, string> = {
        gu: 'gu-IN',
        hi: 'hi-IN',
        en: 'en-IN',
      };
      utterance.lang = langMap[langCode] || 'en-IN';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    isListening,
    transcript,
    setTranscript,
    isSpeaking,
    supported,
    recordingSeconds,
    formatTimer,
    maxDurationSeconds: MAX_DURATION_SECONDS,
    startListening,
    stopListening,
    speakText,
    stopSpeaking
  };
}
