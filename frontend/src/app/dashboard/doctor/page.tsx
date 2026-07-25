'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { EmergencyAlertModal } from '@/components/EmergencyAlertModal';
import { ShieldAlert, Activity, CheckCircle, FileText, Send, User, Calendar, AlertTriangle } from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000); // Polling for real-time RED alerts
    return () => clearInterval(interval);
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
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Doctor Clinical Dashboard</h1>
          <p className="text-xs text-slate-400">Monitor high-risk emergency cases, add clinical notes, and manage patient referrals</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            Welcome, Dr. {user?.full_name}
          </span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-rose-950/40 border border-rose-500/30 p-5 rounded-2xl">
          <span className="text-xs font-bold text-rose-400 block">🔴 Emergency Cases</span>
          <strong className="text-3xl font-black text-rose-500">{data?.summary?.red_cases || 0}</strong>
        </div>
        <div className="bg-amber-950/40 border border-amber-500/30 p-5 rounded-2xl">
          <span className="text-xs font-bold text-amber-400 block">🟡 Observation Cases</span>
          <strong className="text-3xl font-black text-amber-400">{data?.summary?.yellow_cases || 0}</strong>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl">
          <span className="text-xs font-bold text-emerald-400 block">🟢 Routine Cases</span>
          <strong className="text-3xl font-black text-emerald-400">{data?.summary?.green_cases || 0}</strong>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">Pending Referrals</span>
          <strong className="text-3xl font-black text-indigo-400">{data?.summary?.pending_referrals || 0}</strong>
        </div>
      </div>

      {/* Main Grid: Emergency Queue & Case Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Emergency Queue */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Emergency & High Risk Queue
            </h2>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded-full">
              {data?.emergency_queue?.length || 0} Patients
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {data?.emergency_queue?.map((item: any) => (
              <div
                key={item.triage_id}
                onClick={() => handleSelectCase(item.encounter_id)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedEncounter?.id === item.encounter_id
                    ? 'bg-rose-950/80 border-rose-500 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{item.patient_id}</span>
                    <h3 className="text-sm font-bold text-white">{item.patient_name}</h3>
                    <p className="text-xs text-slate-400">{item.age} yrs &bull; {item.gender} &bull; Village: {item.village}</p>
                  </div>
                  <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded">RED</span>
                </div>

                <div className="mt-2 text-[11px] text-rose-200 bg-rose-950/40 p-2 rounded border border-rose-900 font-mono">
                  {item.clinical_reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Case Timeline & Notes Entry */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          {selectedEncounter ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{selectedEncounter.patient?.patient_id}</span>
                  <h2 className="text-xl font-bold text-white">{selectedEncounter.patient?.full_name}</h2>
                  <p className="text-xs text-slate-400">Visit Date: {new Date(selectedEncounter.visit_date).toLocaleString()}</p>
                </div>
              </div>

              {/* Patient Timeline Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Activity className="w-4 h-4" /> Patient Encounter Timeline
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block font-bold">Vitals Recorded</span>
                    {selectedEncounter.vitals?.[0] ? (
                      <p className="text-white">
                        SpO2: <strong className="text-emerald-400">{selectedEncounter.vitals[0].spo2}%</strong> |
                        BP: <strong>{selectedEncounter.vitals[0].systolic_bp}/{selectedEncounter.vitals[0].diastolic_bp}</strong> |
                        Temp: <strong>{selectedEncounter.vitals[0].temperature}°C</strong>
                      </p>
                    ) : (
                      <span className="text-slate-500">No vitals record</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Chief Symptoms</span>
                    <p className="text-white">
                      {selectedEncounter.symptoms?.map((s: any) => s.symptom_name).join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Triage Decision Details */}
                {selectedEncounter.triage_record && (
                  <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-rose-400 block">Rule-Based Triage Findings</span>
                    <p className="text-xs text-slate-200 font-mono">{selectedEncounter.triage_record.clinical_reason}</p>
                  </div>
                )}
              </div>

              {/* Doctor Clinical Notes Entry Form */}
              <form onSubmit={handleAddNotes} className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Doctor Clinical Impression & Notes
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Clinical Diagnosis / Impression</label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Hypertensive Emergency / Suspected Pneumonia"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Doctor Treatment Plan & Orders</label>
                  <textarea
                    required
                    rows={3}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="Enter immediate treatment, medications, or referral instructions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" /> Save Doctor Clinical Notes
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-20 space-y-3">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Select an emergency case from the left queue to review timeline and add clinical notes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
