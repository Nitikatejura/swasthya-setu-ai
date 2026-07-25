'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { apiClient } from '@/lib/api';
import { offlineDb } from '@/db/offlineDb';
import { Mic, MicOff, Volume2, Send, Activity, ShieldAlert, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AssessmentPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patient_id') || 'PAT-001';
  const patientName = searchParams.get('patient_name') || 'Ramesh Patel';
  const patientCode = searchParams.get('patient_code') || 'SS-2026-1024';

  const [step, setStep] = useState<number>(1);
  const [lang, setLang] = useState<string>('gu');

  // Step 1: AI Chat State
  const [messages, setMessages] = useState<any[]>([
    { role: 'model', content: 'નમસ્તે! દર્દીને શું તકલીફ છે? કૃપા કરીને મુખ્ય લક્ષણો જણાવો. (Hello! What symptoms is the patient experiencing?)' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [extractedSymptomText, setExtractedSymptomText] = useState('Chest pain and difficulty breathing');

  // Step 2: Vitals State
  const [spo2, setSpo2] = useState<string>('88');
  const [temp, setTemp] = useState<string>('38.5');
  const [sysBp, setSysBp] = useState<string>('185');
  const [diaBp, setDiaBp] = useState<string>('115');
  const [pulse, setPulse] = useState<string>('112');
  const [respRate, setRespRate] = useState<string font-mono>('28');
  const [height, setHeight] = useState<string>('165');
  const [weight, setWeight] = useState<string>('68');

  // Step 3: Triage Result State
  const [triageResult, setTriageResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { isListening, transcript, startListening, speakText } = useVoice(lang);
  const { queueOfflineAction } = useOfflineSync();
  const router = useRouter();

  // Handle Send Chat
  const handleSendMessage = async () => {
    const textToSend = inputMsg || transcript;
    if (!textToSend.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMsgs);
    setInputMsg('');

    try {
      if (navigator.onLine) {
        const res = await apiClient.post('/ai/chat', { messages: newMsgs, language: lang });
        setMessages([...newMsgs, { role: 'model', content: res.data.reply }]);
        speakText(res.data.reply);
      } else {
        const reply = 'તમારી માહિતી નોંધાઈ ગઈ છે. શું દર્દીને છાતીમાં દુખાવો કે શ્વાસ લેવામાં તકલીફ છે?';
        setMessages([...newMsgs, { role: 'model', content: reply }]);
        speakText(reply);
      }
    } catch (e) {
      const reply = 'Information recorded. Are there any other symptoms?';
      setMessages([...newMsgs, { role: 'model', content: reply }]);
    }
  };

  // Step 2 -> Evaluate Rule-Based Triage
  const handleEvaluateTriage = async () => {
    setLoading(true);

    const vitalsData = {
      spo2: parseFloat(spo2),
      temperature: parseFloat(temp),
      systolic_bp: parseInt(sysBp),
      diastolic_bp: parseInt(diaBp),
      pulse_rate: parseInt(pulse),
      respiratory_rate: parseInt(respRate),
      height: parseFloat(height),
      weight: parseFloat(weight)
    };

    const encounterId = `ENC-${Date.now()}`;

    if (navigator.onLine) {
      try {
        // Create encounter first
        const encRes = await apiClient.post('/encounters', {
          patient_id: patientId,
          notes: 'AI Assisted Encounter',
          symptoms: [{ chief_complaint: extractedSymptomText, symptom_name: extractedSymptomText }],
          vitals: vitalsData
        });

        // Evaluate Triage
        const triageRes = await apiClient.post('/triage/evaluate', {
          encounter_id: encRes.data.id,
          guideline: 'india_nhm'
        });

        setTriageResult(triageRes.data);
      } catch (e) {
        evaluateOfflineTriage(encounterId, vitalsData);
      }
    } else {
      evaluateOfflineTriage(encounterId, vitalsData);
    }

    setLoading(false);
    setStep(3);
  };

  const evaluateOfflineTriage = async (encId: string, vitalsData: any) => {
    // Deterministic Rule fallback logic for offline
    let priority = 'GREEN';
    let reason = 'Vitals within normal limits.';
    let actions = 'Routine Consultation and home care advice.';

    if (vitalsData.spo2 < 90 || vitalsData.systolic_bp >= 180) {
      priority = 'RED';
      reason = `CRITICAL ALERT: Severe Hypoxia (SpO2: ${vitalsData.spo2}%) / Hypertensive Crisis (BP: ${vitalsData.systolic_bp} mmHg). Urgent Doctor Attention Required.`;
      actions = 'Administer Oxygen immediately, position patient upright, dispatch ambulance for urgent transfer.';
    } else if (vitalsData.spo2 <= 94 || vitalsData.temperature >= 38.0) {
      priority = 'YELLOW';
      reason = `Observation Required: Moderate Hypoxia (SpO2: ${vitalsData.spo2}%) or Fever (${vitalsData.temperature}°C).`;
      actions = 'Keep patient under observation, monitor vitals every 15 minutes.';
    }

    const tRec = {
      id: `TR-${Date.now()}`,
      encounter_id: encId,
      priority,
      matched_rules: JSON.stringify([{ code: 'RULE_EVAL', title: priority }]),
      clinical_reason: reason,
      recommended_actions: actions,
      guideline_used: 'india_nhm',
      evaluated_at: new Date().toISOString()
    };

    setTriageResult(tRec);

    // Save offline queue
    await queueOfflineAction('Encounter', encId, 'CREATE', { patient_id: patientId, vitals: vitalsData });
  };

  // BMI Calculation
  const heightM = parseFloat(height) / 100.0;
  const computedBmi = heightM > 0 ? (parseFloat(weight) / (heightM * heightM)).toFixed(1) : 'N/A';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400">{patientCode}</span>
          <h1 className="text-xl font-black text-white">{patientName}</h1>
          <p className="text-xs text-slate-400">Clinical Assessment Workflow & Triage</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>1. AI Symptoms</span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>2. Vitals</span>
          <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>3. Triage Result</span>
        </div>
      </div>

      {/* STEP 1: Multilingual AI Chat Assistant */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-400" /> Multilingual AI Symptom Collection Assistant
            </h2>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-slate-950 text-xs border border-slate-800 rounded px-2 py-1 text-white"
            >
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] p-3 rounded-xl text-xs font-sans ${
                  m.role === 'user'
                    ? 'ml-auto bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startListening}
              className={`p-3 rounded-xl text-white font-bold text-xs flex items-center gap-1 transition ${
                isListening ? 'bg-rose-600 animate-pulse' : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title="Voice Input (STT)"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMsg || transcript}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Describe symptoms or talk in Gujarati/Hindi/English..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <button
              onClick={handleSendMessage}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2"
            >
              <span>Next: Record Vital Signs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Vital Signs Entry */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Record Patient Vital Signs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-300">SpO₂ (%)</label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-xs font-bold ${
                  parseFloat(spo2) < 90 ? 'border-rose-500 text-rose-400 bg-rose-950/40' : 'border-slate-800 text-white'
                }`}
              />
              {parseFloat(spo2) < 90 && <span className="text-[10px] text-rose-400 font-bold">🔴 Severe Hypoxia</span>}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Body Temp (°C)</label>
              <input
                type="number"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={sysBp}
                onChange={(e) => setSysBp(e.target.value)}
                className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-xs font-bold ${
                  parseInt(sysBp) >= 180 ? 'border-rose-500 text-rose-400 bg-rose-950/40' : 'border-slate-800 text-white'
                }`}
              />
              {parseInt(sysBp) >= 180 && <span className="text-[10px] text-rose-400 font-bold">🔴 Hypertensive Crisis</span>}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={diaBp}
                onChange={(e) => setDiaBp(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Pulse Rate (bpm)</label>
              <input
                type="number"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Resp Rate (breaths/min)</label>
              <input
                type="number"
                value={respRate}
                onChange={(e) => setRespRate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-300">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex justify-between items-center">
            <span>Auto-Calculated BMI:</span>
            <strong className="text-emerald-400 text-sm font-mono">{computedBmi} kg/m²</strong>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={handleEvaluateTriage}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>{loading ? 'Evaluating Rules...' : 'Run Triage Engine & Generate Priority'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Triage Result Page */}
      {step === 3 && triageResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          {/* Priority Badge */}
          <div className={`p-6 rounded-2xl border flex items-center justify-between ${
            triageResult.priority === 'RED'
              ? 'bg-rose-950/80 border-rose-500 text-white'
              : triageResult.priority === 'YELLOW'
              ? 'bg-amber-950/80 border-amber-500 text-white'
              : 'bg-emerald-950/80 border-emerald-500 text-white'
          }`}>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Deterministic Clinical Triage Priority</span>
              <h2 className="text-3xl font-black">{triageResult.priority} PRIORITY CASE</h2>
              <p className="text-xs opacity-90">Guideline Evaluated: {triageResult.guideline_used?.toUpperCase() || 'INDIA NHM'}</p>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-2xl font-black text-4xl">
              {triageResult.priority === 'RED' ? '🔴' : triageResult.priority === 'YELLOW' ? '🟡' : '🟢'}
            </div>
          </div>

          {/* Clinical Reason & Recommended Actions */}
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Clinical Reasoning</h3>
              <p className="text-xs text-slate-200 font-mono leading-relaxed">{triageResult.clinical_reason}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Recommended Action Protocol</h3>
              <p className="text-xs text-slate-200 leading-relaxed">{triageResult.recommended_actions}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => router.push('/dashboard/worker')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
            >
              Complete & Return to Registry
            </button>

            {triageResult.priority === 'RED' && (
              <button
                onClick={() => router.push(`/referrals?patient_id=${patientId}&encounter_id=${triageResult.encounter_id}`)}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/30 animate-pulse"
              >
                <ShieldAlert className="w-4 h-4" /> Create High-Risk Referral & Printable QR
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
