'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Activity, Calendar, FileText, Stethoscope, ShieldAlert, ArrowLeft, Heart, User, CheckCircle2, Clock } from 'lucide-react';

export default function PatientTimelinePage() {
  const params = useParams();
  const patientId = params?.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="max-w-5xl mx-auto py-12 text-center space-y-4">
        <Activity className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">Loading patient clinical timeline history...</p>
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Patient Record Not Found</h2>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">
          Return Back
        </button>
      </div>
    );
  }

  const { patient, encounters, referrals } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {patient.patient_id}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{patient.full_name}</h1>
            <p className="text-xs text-slate-500">
              {patient.age} yrs &bull; {patient.gender} &bull; Village: <strong>{patient.village}</strong> &bull; Blood: <strong>{patient.blood_group || 'N/A'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/assessment?patient_id=${patient.id}&patient_name=${encodeURIComponent(patient.full_name)}&patient_code=${patient.patient_id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4" /> New Visit & Assessment
          </Link>
          <button
            onClick={() => router.back()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {/* Patient Clinical Profile Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-bold block">Contact Information</span>
          <p className="text-slate-900">Phone: <strong>{patient.phone_number || 'N/A'}</strong></p>
          <p className="text-slate-900">Emergency: <strong>{patient.emergency_contact || 'N/A'}</strong></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-bold block">Maternal & Risk Status</span>
          <p className="text-slate-900">Pregnancy: <strong>{patient.pregnancy_status || 'Not Applicable'}</strong></p>
          <p className="text-slate-900">Known Allergies: <strong>{patient.allergies || 'None'}</strong></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-bold block">Medical History</span>
          <p className="text-slate-900 leading-relaxed font-mono">{patient.medical_history || 'No chronic condition history recorded.'}</p>
        </div>
      </div>

      {/* Encounter Timeline List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" /> Chronological Encounter Timeline ({encounters.length} Visits)
        </h2>

        {encounters.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-xs text-slate-500">
            No clinic visits or encounters recorded yet for this patient.
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-200">
            {encounters.map((enc: any, index: number) => (
              <div key={enc.encounter_id} className="relative pl-12 space-y-3">
                {/* Timeline node icon */}
                <div className={`absolute left-3.5 top-1.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                  enc.triage_record?.priority === 'RED'
                    ? 'border-rose-500 text-rose-500'
                    : enc.triage_record?.priority === 'YELLOW'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-emerald-500 text-emerald-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    enc.triage_record?.priority === 'RED' ? 'bg-rose-500' : enc.triage_record?.priority === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                </div>

                {/* Encounter Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  {/* Card Header */}
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-500">VISIT #{encounters.length - index}</span>
                      <h3 className="text-sm font-bold text-slate-900">{new Date(enc.visit_date).toLocaleString()}</h3>
                    </div>

                    {enc.triage_record && (
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        enc.triage_record.priority === 'RED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : enc.triage_record.priority === 'YELLOW'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {enc.triage_record.priority === 'RED' ? '🔴 RED EMERGENCY' : enc.triage_record.priority === 'YELLOW' ? '🟡 YELLOW OBSERVATION' : '🟢 GREEN ROUTINE'}
                      </span>
                    )}
                  </div>

                  {/* Vitals Breakdown */}
                  {enc.vitals?.[0] && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-emerald-600" /> Vital Signs Recorded
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-500 block text-[11px]">SpO₂</span>
                          <strong className={enc.vitals[0].spo2 && enc.vitals[0].spo2 < 90 ? 'text-rose-600 font-black' : 'text-slate-900'}>
                            {enc.vitals[0].spo2 ? `${enc.vitals[0].spo2}%` : 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Blood Pressure</span>
                          <strong className={enc.vitals[0].systolic_bp && enc.vitals[0].systolic_bp >= 180 ? 'text-rose-600 font-black' : 'text-slate-900'}>
                            {enc.vitals[0].systolic_bp}/{enc.vitals[0].diastolic_bp} mmHg
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Body Temp</span>
                          <strong className="text-slate-900">{enc.vitals[0].temperature}°C</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Pulse / Resp</span>
                          <strong className="text-slate-900">{enc.vitals[0].pulse_rate} bpm / {enc.vitals[0].respiratory_rate} rpm</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Symptoms Recorded */}
                  {enc.symptoms?.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Chief Symptoms</h4>
                      <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {enc.symptoms.map((s: any) => s.symptom_name).join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Triage Decision Reason */}
                  {enc.triage_record && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical Triage Evaluation</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 space-y-1">
                        <p><strong>Reasoning:</strong> {enc.triage_record.clinical_reason}</p>
                        <p><strong>Recommended Action:</strong> {enc.triage_record.recommended_actions}</p>
                      </div>
                    </div>
                  )}

                  {/* Doctor Clinical Notes */}
                  {enc.doctor_notes?.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" /> Doctor Clinical Orders & Diagnosis
                      </h4>
                      {enc.doctor_notes.map((dn: any, idx: number) => (
                        <div key={idx} className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
                          <p className="font-bold text-slate-900">Diagnosis: {dn.diagnosis_impression || 'N/A'}</p>
                          <p className="text-slate-800">Treatment Plan: {dn.treatment_plan}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referrals Section */}
      {referrals?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" /> Patient Referral Documents ({referrals.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {referrals.map((ref: any, idx: number) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="font-mono text-emerald-700">{ref.referral_number}</strong>
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">{ref.urgency} URGENCY</span>
                </div>
                <p className="text-slate-800 font-medium">Destination: {ref.destination_department}</p>
                <p className="text-slate-600 font-mono text-[11px]">{ref.referral_reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
