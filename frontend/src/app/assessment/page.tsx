'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useVoice } from '@/hooks/useVoice';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Mic, Send, Activity, ShieldAlert, ArrowRight, ArrowLeft,
  Volume2, Stethoscope, RefreshCw, CheckCircle2, Sparkles, AlertCircle
} from 'lucide-react';

export default function ClinicalAssessmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, setLang } = useTranslation();

  const patientId = searchParams.get('patient_id') || '';
  const patientName = searchParams.get('patient_name') || 'Emergency Patient';
  const patientCode = searchParams.get('patient_code') || 'SS-2026-000';

  const [step, setStep] = useState(1);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'model',
      content: lang === 'gu'
        ? 'નમસ્તે! હું સ્વાસ્થ્યસેતુ AI મદદનીશ છું. દર્દીને શું તકલીફ છે તે કૃપા કરીને જણાવો.'
        : lang === 'hi'
        ? 'नमस्ते! मैं स्वास्थ्यसेतु AI सहायक हूँ। कृपया मरीज के लक्षण बताएं।'
        : 'Hello! I am SwasthyaSetu AI Assistant. Please describe the patient’s symptoms.'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [extractedSymptomText, setExtractedSymptomText] = useState('');

  // Step 2: Vitals State
  const [spo2, setSpo2] = useState<string>('');
  const [temp, setTemp] = useState<string>('');
  const [sysBp, setSysBp] = useState<string>('');
  const [diaBp, setDiaBp] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [respRate, setRespRate] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  const [triageResult, setTriageResult] = useState<any>(null);
  const [triageExplanation, setTriageExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { isListening, transcript, startListening, speakText } = useVoice(lang);
  const { queueOfflineAction } = useOfflineSync();

  const suggestedQuestions = [
    lang === 'gu' ? 'તાવ ૫ દિવસથી આવે છે' : 'Fever for 5 days',
    lang === 'gu' ? 'છાતીમાં સખત દુખાવો છે' : 'Severe chest pain',
    lang === 'gu' ? 'શ્વાસ લેવામાં તકલીફ અનુભવાય છે' : 'Breathing difficulty'
  ];

  // Handle Send Chat
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputMsg || transcript;
    if (!textToSend.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMsgs);
    setInputMsg('');
    setExtractedSymptomText((prev) => (prev ? `${prev}, ${textToSend}` : textToSend));

    try {
      if (navigator.onLine) {
        const res = await apiClient.post('/ai/chat', { messages: newMsgs, language: lang });
        setMessages([...newMsgs, { role: 'model', content: res.data.reply }]);
        speakText(res.data.reply);
      } else {
        const reply = lang === 'gu'
          ? 'તમારી માહિતી નોંધાઈ ગઈ છે. શું દર્દીને છાતીમાં દુખાવો, ઝાડા-ઊલટી કે શ્વાસ લેવામાં તકલીફ છે?'
          : lang === 'hi'
          ? 'आपकी जानकारी दर्ज कर ली गई है। क्या मरीज को सीने में दर्द या सांस लेने में परेशानी है?'
          : 'Information recorded. Does the patient have any chest pain or difficulty breathing?';
        setMessages([...newMsgs, { role: 'model', content: reply }]);
        speakText(reply);
      }
    } catch (e) {
      const reply = lang === 'gu'
        ? 'આભાર. દર્દીના લક્ષણો નોંધાઈ ગયા છે. શું દર્દીને અન્ય કોઈ શારીરિક તકલીફ છે?'
        : 'Thank you. Recorded symptoms. Are there any other symptoms to report?';
      setMessages([...newMsgs, { role: 'model', content: reply }]);
    }
  };

  // Step 2 -> Evaluate Rule-Based Triage
  const handleEvaluateTriage = async () => {
    setLoading(true);

    const vitalsData = {
      spo2: spo2 ? parseFloat(spo2) : null,
      temperature: temp ? parseFloat(temp) : null,
      systolic_bp: sysBp ? parseInt(sysBp) : null,
      diastolic_bp: diaBp ? parseInt(diaBp) : null,
      pulse_rate: pulse ? parseInt(pulse) : null,
      respiratory_rate: respRate ? parseInt(respRate) : null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null
    };

    const encounterId = `ENC-${Date.now()}`;
    const symptomQuery = extractedSymptomText || 'Indisposition / Symptom Consultation';

    if (navigator.onLine) {
      try {
        const encRes = await apiClient.post('/encounters', {
          patient_id: patientId,
          notes: 'AI Assisted Encounter',
          symptoms: [{ chief_complaint: symptomQuery, symptom_name: symptomQuery }],
          vitals: vitalsData
        });

        const triageRes = await apiClient.post('/triage/evaluate', {
          encounter_id: encRes.data.id,
          guideline: 'india_nhm'
        });

        setTriageResult(triageRes.data);

        try {
          const expRes = await apiClient.post('/ai/explain-triage', {
            priority: triageRes.data.priority,
            matched_rules: typeof triageRes.data.matched_rules === 'string' ? JSON.parse(triageRes.data.matched_rules) : triageRes.data.matched_rules,
            vitals: vitalsData,
            language: lang
          });
          setTriageExplanation(expRes.data.explanation);
        } catch (err) {}
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
    let priority = 'GREEN';
    let reason = 'Vitals within normal limits.';
    let actions = 'Routine Consultation and home care advice.';

    const numSpo2 = vitalsData.spo2 || 98;
    const numSysBp = vitalsData.systolic_bp || 120;

    if (numSpo2 < 90 || numSysBp >= 180) {
      priority = 'RED';
      reason = `CRITICAL ALERT: Severe Hypoxia (SpO2: ${numSpo2}%) / Hypertensive Crisis (BP: ${numSysBp} mmHg). Urgent Doctor Attention Required.`;
      actions = 'Administer Oxygen immediately, position patient upright, dispatch ambulance for urgent transfer.';
    } else if (numSpo2 <= 94 || (vitalsData.temperature && vitalsData.temperature >= 38.0)) {
      priority = 'YELLOW';
      reason = `Observation Required: Moderate Hypoxia (SpO2: ${numSpo2}%) or Fever (${vitalsData.temperature}°C).`;
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
    await queueOfflineAction('Encounter', encId, 'CREATE', { patient_id: patientId, vitals: vitalsData });
  };

  // BMI Calculation
  const heightM = parseFloat(height) / 100.0;
  const computedBmi = (heightM > 0 && weight) ? (parseFloat(weight) / (heightM * heightM)).toFixed(1) : 'N/A';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">{patientCode}</span>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1">{patientName}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Clinical Assessment & Rule-Based Triage</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className={`px-3.5 py-1.5 rounded-full transition ${step === 1 ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>1. AI Symptoms</span>
          <span className={`px-3.5 py-1.5 rounded-full transition ${step === 2 ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>2. Vitals</span>
          <span className={`px-3.5 py-1.5 rounded-full transition ${step === 3 ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>3. Triage Result</span>
        </div>
      </div>

      {/* STEP 1: Multilingual AI Chat Assistant */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Multilingual AI Symptom Interview Assistant
            </h2>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-1.5 text-slate-800 dark:text-slate-200 font-bold focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
            >
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="h-72 overflow-y-auto space-y-3 p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-sans shadow-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-teal-600 text-white rounded-br-none font-medium'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none'
                }`}
              >
                {m.content}
              </motion.div>
            ))}
          </div>

          {/* Suggested Quick Question Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 self-center">Quick Input:</span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1 bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 text-teal-800 dark:text-teal-300 rounded-full text-[11px] font-bold border border-teal-200 dark:border-teal-800 transition"
              >
                + {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={startListening}
              className={`p-3.5 rounded-2xl text-white font-bold text-xs flex items-center gap-1 transition ${
                isListening ? 'bg-rose-600 animate-pulse' : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700'
              }`}
              title="Voice Input (STT)"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMsg || transcript}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Describe symptoms or speak in Gujarati/Hindi/English..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900"
            />

            <button
              onClick={() => handleSendMessage()}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-bold text-xs rounded-2xl flex items-center gap-1 shadow-md shadow-teal-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-teal-600/20"
            >
              <span>Next: Record Vital Signs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Vital Signs Entry */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Record Patient Vital Signs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">SpO₂ (%)</label>
              <input
                type="number"
                placeholder="e.g. 98"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs font-bold ${
                  spo2 && parseFloat(spo2) < 90 ? 'border-rose-500 text-rose-700 bg-rose-50' : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                }`}
              />
              {spo2 && parseFloat(spo2) < 90 && <span className="text-[10px] text-rose-600 font-bold">🔴 Severe Hypoxia (&lt;90%)</span>}
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Body Temp (°C)</label>
              <input
                type="number"
                placeholder="e.g. 37.0"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Systolic BP (mmHg)</label>
              <input
                type="number"
                placeholder="e.g. 120"
                value={sysBp}
                onChange={(e) => setSysBp(e.target.value)}
                className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs font-bold ${
                  sysBp && parseInt(sysBp) >= 180 ? 'border-rose-500 text-rose-700 bg-rose-50' : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                }`}
              />
              {sysBp && parseInt(sysBp) >= 180 && <span className="text-[10px] text-rose-600 font-bold">🔴 Hypertensive Crisis</span>}
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Diastolic BP (mmHg)</label>
              <input
                type="number"
                placeholder="e.g. 80"
                value={diaBp}
                onChange={(e) => setDiaBp(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Pulse Rate (bpm)</label>
              <input
                type="number"
                placeholder="e.g. 72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Resp Rate (breaths/min)</label>
              <input
                type="number"
                placeholder="e.g. 16"
                value={respRate}
                onChange={(e) => setRespRate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Height (cm)</label>
              <input
                type="number"
                placeholder="e.g. 165"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Weight (kg)</label>
              <input
                type="number"
                placeholder="e.g. 68"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex justify-between items-center">
            <span>Auto-Calculated Body Mass Index (BMI):</span>
            <strong className="text-teal-600 dark:text-teal-400 text-sm font-mono">{computedBmi} kg/m²</strong>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={handleEvaluateTriage}
              disabled={loading}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-600/30"
            >
              <span>{loading ? 'Evaluating Guidelines...' : 'Run Triage Engine & Generate Priority'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Triage Result Page */}
      {step === 3 && triageResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
          {/* Priority Badge Banner */}
          <div className={`p-6 rounded-3xl border flex items-center justify-between shadow-md ${
            triageResult.priority === 'RED'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              : triageResult.priority === 'YELLOW'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              : 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-100'
          }`}>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Deterministic Rule Engine Evaluation</span>
              <h2 className="text-3xl font-black">{triageResult.priority} PRIORITY CASE</h2>
              <p className="text-xs opacity-90">Guideline Evaluated: {triageResult.guideline_used?.toUpperCase() || 'INDIA NHM'}</p>
            </div>
            <div className="p-4 bg-white/90 dark:bg-slate-900/90 rounded-2xl font-black text-4xl shadow-sm border border-slate-200 dark:border-slate-800">
              {triageResult.priority === 'RED' ? '🔴' : triageResult.priority === 'YELLOW' ? '🟡' : '🟢'}
            </div>
          </div>

          {/* Clinical Reasoning & AI Explanation */}
          <div className="space-y-4">
            {triageExplanation && (
              <div className="bg-teal-50/80 dark:bg-teal-950/60 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" /> AI Clinical Triage Explanation
                </h3>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{triageExplanation}</p>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-1">Clinical Reasoning</h3>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed">{triageResult.clinical_reason}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-1">Recommended Action Protocol</h3>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{triageResult.recommended_actions}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => router.push('/dashboard/worker')}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl"
            >
              Complete & Return to Registry
            </button>

            {triageResult.priority === 'RED' && (
              <button
                onClick={() => router.push(`/referrals?patient_id=${patientId}&encounter_id=${triageResult.encounter_id}`)}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-600/30 animate-pulse"
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
