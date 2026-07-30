'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api';
import { EmergencyAlertModal } from '@/components/EmergencyAlertModal';
import { motion } from 'framer-motion';
import {
  Stethoscope, ShieldAlert, Activity, CheckCircle, Clock, Heart, AlertTriangle,
  User, FileText, Send, ArrowRight, RefreshCw, Calendar, MapPin, Phone
} from 'lucide-react';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [data, setData] = useState<any>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchDoctorData = async () => {
    try {
      const res = await apiClient.get('/doctor/dashboard');
      setData(res.data);
      if (res.data.emergency_queue && res.data.emergency_queue.length > 0) {
        setAlerts(res.data.emergency_queue);
      }
    } catch (e) {
      console.error('Failed to fetch doctor dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
    const interval = setInterval(fetchDoctorData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCase = async (encounterId: string) => {
    try {
      const encRes = await apiClient.get(`/encounters/${encounterId}`);
      setSelectedEncounter(encRes.data);
      setDoctorNotes(encRes.data.notes || '');
    } catch (e) {
      console.error('Failed to fetch encounter details:', e);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;
    setSavingNotes(true);
    try {
      await apiClient.put(`/doctor/cases/${selectedEncounter.id}/impression`, {
        doctor_impression: doctorNotes,
        treatment_orders: doctorNotes,
        encounter_id: selectedEncounter.id
      });
      alert('Doctor clinical impression saved!');
      fetchDoctorData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to save impression');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await apiClient.put(`/doctor/alerts/${alertId}/acknowledge`);
      setAlerts((prev) => prev.filter((a) => (a.alert_id || a.triage_id || a.id) !== alertId));
      fetchDoctorData();
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
      setAlerts((prev) => prev.filter((a) => (a.alert_id || a.triage_id || a.id) !== alertId));
    }
  };

  return (
    <div className="space-y-8">
      {/* Real-time RED Alert Emergency Modal */}
      <EmergencyAlertModal
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onSelectCase={handleSelectCase}
      />

      {/* Doctor Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('doctor_dashboard')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('doc_welcome')} {user?.full_name || 'Medical Officer'} &bull; Anand District Hospital</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-3 py-1.5 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t('active_mo')}</span>
          </span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">{t('emergency_red')}</span>
          <strong className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 block">{data?.summary?.red_cases || 0}</strong>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">{t('observation_yellow')}</span>
          <strong className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{data?.summary?.yellow_cases || 0}</strong>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-teal-700 dark:text-teal-300 block">{t('routine_green')}</span>
          <strong className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1 block">{data?.summary?.green_cases || 0}</strong>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">{t('referrals_generated')}</span>
          <strong className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{data?.summary?.pending_referrals || 0}</strong>
        </motion.div>
      </div>

      {/* Main Grid: Emergency Queue & Case Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Emergency Queue */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              {t('emergency_queue')}
            </h2>
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full">
              {data?.emergency_queue?.length || 0}
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {data?.emergency_queue?.map((item: any) => (
              <div
                key={item.triage_id}
                onClick={() => handleSelectCase(item.encounter_id)}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  selectedEncounter?.id === item.encounter_id
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 shadow-md'
                    : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">{item.patient_id}</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{item.patient_name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.age} yrs &bull; {item.gender} &bull; Village: {item.village}</p>
                  </div>
                  <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-lg shadow-sm">RED</span>
                </div>

                <div className="mt-2 text-[11px] text-rose-800 dark:text-rose-200 bg-rose-100/60 dark:bg-rose-900/40 p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-800 font-mono">
                  {item.clinical_reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Case Review Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
          {selectedEncounter ? (
            <div className="space-y-5">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">ENCOUNTER ID: {selectedEncounter.id}</span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedEncounter.patient_name || 'Emergency Patient'}</h2>
                </div>
                <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-full shadow-sm">🔴 RED PRIORITY</span>
              </div>

              {/* Vitals Summary */}
              {selectedEncounter.vitals && selectedEncounter.vitals.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('vitals')}</h3>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] block">{t('spo2')}</span>
                      <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold">{selectedEncounter.vitals[0].spo2 || 'N/A'}%</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] block">{t('blood_pressure')}</span>
                      <strong className="text-slate-900 dark:text-white font-mono font-bold">{selectedEncounter.vitals[0].systolic_bp}/{selectedEncounter.vitals[0].diastolic_bp}</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] block">{t('temperature')}</span>
                      <strong className="text-slate-900 dark:text-white font-mono font-bold">{selectedEncounter.vitals[0].temperature}°C</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] block">{t('pulse_rate')}</span>
                      <strong className="text-slate-900 dark:text-white font-mono font-bold">{selectedEncounter.vitals[0].pulse_rate} bpm</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor Impression Form */}
              <form onSubmit={handleSaveNotes} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{t('medical_impression')}</label>
                <textarea
                  rows={4}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter medical evaluation, immediate clinical orders, and prescription notes..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                />

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingNotes}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-md shadow-teal-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{savingNotes ? 'Saving...' : t('save_orders')}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-20 space-y-3">
              <Stethoscope className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('select_patient_case')}</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
