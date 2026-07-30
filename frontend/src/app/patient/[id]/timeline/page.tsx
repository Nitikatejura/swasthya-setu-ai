'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Activity, Calendar, FileText, Stethoscope, ShieldAlert, ArrowLeft, Heart, User, CheckCircle2, QrCode, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function PatientTimelinePage() {
  const params = useParams();
  const patientId = params?.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    async function fetchTimeline() {
      if (!patientId) return;
      try {
        const res = await apiClient.get(`/patients/${patientId}/timeline`);
        setData(res.data);
      } catch (e) {
        console.error('Failed to load patient timeline:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [patientId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center space-y-4">
        <Activity className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Loading patient clinical timeline history...</p>
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Patient Record Not Found</h2>
        <button onClick={() => router.back()} className="px-5 py-2.5 bg-slate-800 text-white rounded-2xl text-xs font-bold">
          Return Back
        </button>
      </div>
    );
  }

  const { patient, encounters, referrals } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-teal-100/80 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 rounded-2xl border border-teal-200 dark:border-teal-800">
            <User className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
              {patient.patient_id}
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{patient.full_name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {patient.age} yrs &bull; {patient.gender} &bull; Village: <strong>{patient.village}</strong> &bull; Blood: <strong>{patient.blood_group || 'N/A'}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Printable Patient QR
          </button>
          <Link
            href={`/assessment?patient_id=${patient.id}&patient_name=${encodeURIComponent(patient.full_name)}&patient_code=${patient.patient_id}`}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-teal-600/20 flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4" /> New Visit & Assessment
          </Link>
          <button
            onClick={() => router.back()}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {/* Patient Clinical Profile Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-bold block">Contact Information</span>
          <p className="text-slate-900 dark:text-white">Phone: <strong>{patient.phone_number || 'N/A'}</strong></p>
          <p className="text-slate-900 dark:text-white">Emergency: <strong>{patient.emergency_contact || 'N/A'}</strong></p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-bold block">Risk Status & Allergies</span>
          <p className="text-slate-900 dark:text-white">Pregnancy: <strong>{patient.pregnancy_status || 'Not Applicable'}</strong></p>
          <p className="text-slate-900 dark:text-white">Known Allergies: <strong>{patient.allergies || 'None'}</strong></p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-bold block">Medical History</span>
          <p className="text-slate-900 dark:text-white leading-relaxed font-mono">{patient.medical_history || 'No chronic condition history recorded.'}</p>
        </div>
      </div>

      {/* Encounter Timeline List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Chronological Encounter Timeline ({encounters.length} Visits)
        </h2>

        {encounters.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 rounded-3xl text-center text-xs text-slate-500 dark:text-slate-400">
            No clinic visits or encounters recorded yet for this patient.
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {encounters.map((enc: any, index: number) => (
              <motion.div
                key={enc.encounter_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-12 space-y-3"
              >
                {/* Timeline node icon */}
                <div className={`absolute left-3.5 top-2 w-5 h-5 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center ${
                  enc.triage_record?.priority === 'RED'
                    ? 'border-rose-500 text-rose-500'
                    : enc.triage_record?.priority === 'YELLOW'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-teal-500 text-teal-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    enc.triage_record?.priority === 'RED' ? 'bg-rose-500' : enc.triage_record?.priority === 'YELLOW' ? 'bg-amber-500' : 'bg-teal-500'
                  }`} />
                </div>

                {/* Encounter Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  {/* Card Header */}
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">VISIT #{encounters.length - index}</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{new Date(enc.visit_date).toLocaleString()}</h3>
                    </div>

                    {enc.triage_record && (
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        enc.triage_record.priority === 'RED'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : enc.triage_record.priority === 'YELLOW'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      }`}>
                        {enc.triage_record.priority === 'RED' ? '🔴 RED EMERGENCY' : enc.triage_record.priority === 'YELLOW' ? '🟡 YELLOW OBSERVATION' : '🟢 GREEN ROUTINE'}
                      </span>
                    )}
                  </div>

                  {/* Vitals Breakdown */}
                  {enc.vitals?.[0] && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Vital Signs Recorded
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">SpO₂</span>
                          <strong className={enc.vitals[0].spo2 && enc.vitals[0].spo2 < 90 ? 'text-rose-600 font-black' : 'text-slate-900 dark:text-white'}>
                            {enc.vitals[0].spo2 ? `${enc.vitals[0].spo2}%` : 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Blood Pressure</span>
                          <strong className={enc.vitals[0].systolic_bp && enc.vitals[0].systolic_bp >= 180 ? 'text-rose-600 font-black' : 'text-slate-900 dark:text-white'}>
                            {enc.vitals[0].systolic_bp}/{enc.vitals[0].diastolic_bp} mmHg
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Body Temp</span>
                          <strong className="text-slate-900 dark:text-white">{enc.vitals[0].temperature}°C</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Pulse / Resp</span>
                          <strong className="text-slate-900 dark:text-white">{enc.vitals[0].pulse_rate} bpm / {enc.vitals[0].respiratory_rate} rpm</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Symptoms Recorded */}
                  {enc.symptoms?.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chief Symptoms</h4>
                      <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                        {enc.symptoms.map((s: any) => s.symptom_name).join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Triage Decision Reason */}
                  {enc.triage_record && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Clinical Triage Evaluation</h4>
                      <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 space-y-1">
                        <p><strong>Reasoning:</strong> {enc.triage_record.clinical_reason}</p>
                        <p><strong>Recommended Action:</strong> {enc.triage_record.recommended_actions}</p>
                      </div>
                    </div>
                  )}

                  {/* Doctor Clinical Notes */}
                  {enc.doctor_notes?.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" /> Doctor Clinical Orders & Diagnosis
                      </h4>
                      {enc.doctor_notes.map((dn: any, idx: number) => (
                        <div key={idx} className="bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 p-3.5 rounded-2xl text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">Diagnosis: {dn.diagnosis_impression || 'N/A'}</p>
                          <p className="text-slate-800 dark:text-slate-200">Treatment Plan: {dn.treatment_plan}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Patient Digital QR Health Pass</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scan at referral hospital to access instant clinical history</p>

            <div className="bg-white p-4 rounded-2xl w-fit mx-auto border border-slate-200 shadow-inner">
              <QRCodeSVG value={`https://swasthyasetu.org/patient/${patient.id}`} size={180} />
            </div>

            <div className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300">
              ID: {patient.patient_id}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs"
            >
              Close QR Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
