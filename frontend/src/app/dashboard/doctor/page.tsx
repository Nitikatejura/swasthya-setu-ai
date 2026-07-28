'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { EmergencyAlertModal } from '@/components/EmergencyAlertModal';
import { ShieldAlert, Activity, FileText, Send } from 'lucide-react';

import { useWebSocket } from '@/hooks/useWebSocket';
import { useTranslation } from '@/lib/i18n';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [doctorNote, setDoctorNote] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [plan, setPlan] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/doctor/dashboard/doctor');
      setData(res.data);

      const alertsRes = await apiClient.get('/doctor/alerts');
      setAlerts(alertsRes.data);
    } catch (e) {}
  };

  // Real-time WebSocket listener for immediate RED alerts
  useWebSocket((newAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    fetchDashboard();
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAcknowledge = async (triageId: string) => {
    try {
      await apiClient.put(`/doctor/alerts/${triageId}/acknowledge`);
      setAlerts((prev) => prev.filter((a) => a.alert_id !== triageId));
      fetchDashboard();
    } catch (e) {}
  };

  const handleSelectCase = async (encounterId: string) => {
    try {
      const res = await apiClient.get(`/encounters/${encounterId}`);
      setSelectedEncounter(res.data);
    } catch (e) {}
  };

  const handleAddNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;

    try {
      await apiClient.post('/doctor/notes', {
        encounter_id: selectedEncounter.id,
        notes: doctorNote,
        diagnosis_impression: diagnosis,
        treatment_plan: plan
      });
      alert('Clinical notes saved successfully!');
      setDoctorNote('');
      setDiagnosis('');
      setPlan('');
      fetchDashboard();
    } catch (err: any) {
      alert('Failed to save notes');
    }
  };

  return (
    <div className="space-y-8">
      {/* Real-time Emergency Popup Alert Modal */}
      <EmergencyAlertModal alerts={alerts} onAcknowledge={handleAcknowledge} />

      {/* Doctor Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Doctor Clinical Dashboard</h1>
          <p className="text-xs text-slate-500">Monitor high-risk emergency cases, add clinical notes, and manage patient referrals</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Welcome, Dr. {user?.full_name}
          </span>
        </div>
      </div>

      {/* Doctor Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('doctor_dashboard')}</h1>
          <p className="text-xs text-slate-500">Welcome, {user?.full_name || 'Medical Officer'} &bull; Facility: Anand District Hospital</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-rose-700 block">{t('emergency_red')}</span>
          <strong className="text-3xl font-black text-rose-600">{data?.summary?.red_cases || 0}</strong>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-amber-700 block">{t('observation_yellow')}</span>
          <strong className="text-3xl font-black text-amber-600">{data?.summary?.yellow_cases || 0}</strong>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-emerald-700 block">{t('routine_green')}</span>
          <strong className="text-3xl font-black text-emerald-600">{data?.summary?.green_cases || 0}</strong>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">{t('referrals_generated')}</span>
          <strong className="text-3xl font-black text-indigo-600">{data?.summary?.pending_referrals || 0}</strong>
        </div>
      </div>

      {/* Main Grid: Emergency Queue & Case Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Emergency Queue */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              {t('emergency_queue')}
            </h2>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              {data?.emergency_queue?.length || 0}
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {data?.emergency_queue?.map((item: any) => (
              <div
                key={item.triage_id}
                onClick={() => handleSelectCase(item.encounter_id)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedEncounter?.id === item.encounter_id
                    ? 'bg-rose-50 border-rose-400 shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{item.patient_id}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{item.patient_name}</h3>
                    <p className="text-xs text-slate-500">{item.age} yrs &bull; {item.gender} &bull; Village: {item.village}</p>
                  </div>
                  <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded">RED</span>
                </div>

                <div className="mt-2 text-[11px] text-rose-800 bg-rose-100/60 p-2 rounded border border-rose-200 font-mono">
                  {item.clinical_reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Case Timeline & Notes Entry */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          {selectedEncounter ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-700 font-bold">{selectedEncounter.patient?.patient_id}</span>
                  <h2 className="text-xl font-bold text-slate-900">{selectedEncounter.patient?.full_name}</h2>
                  <p className="text-xs text-slate-500">Visit Date: {new Date(selectedEncounter.visit_date).toLocaleString()}</p>
                </div>

                <a
                  href={`/patient/${selectedEncounter.patient?.id}/timeline`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 transition"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Full Patient Timeline
                </a>
              </div>

              {/* Patient Timeline Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <Activity className="w-4 h-4 text-emerald-600" /> Patient Encounter Timeline
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block font-bold">Vitals Recorded</span>
                    {selectedEncounter.vitals?.[0] ? (
                      <p className="text-slate-900">
                        SpO2: <strong className="text-emerald-700">{selectedEncounter.vitals[0].spo2}%</strong> |
                        BP: <strong>{selectedEncounter.vitals[0].systolic_bp}/{selectedEncounter.vitals[0].diastolic_bp}</strong> |
                        Temp: <strong>{selectedEncounter.vitals[0].temperature}°C</strong>
                      </p>
                    ) : (
                      <span className="text-slate-400">No vitals record</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">Chief Symptoms</span>
                    <p className="text-slate-900">
                      {selectedEncounter.symptoms?.map((s: any) => s.symptom_name).join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Triage Decision Details */}
                {selectedEncounter.triage_record && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-rose-700 block">Rule-Based Triage Findings</span>
                    <p className="text-xs text-rose-900 font-mono">{selectedEncounter.triage_record.clinical_reason}</p>
                  </div>
                )}
              </div>

              {/* Doctor Clinical Notes Entry Form */}
              <form onSubmit={handleAddNotes} className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-emerald-600" /> Doctor Clinical Impression & Notes
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Diagnosis / Impression</label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Hypertensive Emergency / Suspected Pneumonia"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Treatment Plan & Orders</label>
                  <textarea
                    required
                    rows={3}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="Enter immediate treatment, medications, or referral instructions..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" /> Save Doctor Clinical Notes
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-20 space-y-3">
              <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">Select an emergency case from the left queue to review timeline and add clinical notes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
