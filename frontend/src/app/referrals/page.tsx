'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/lib/api';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Printer, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ReferralsPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patient_id') || 'PAT-001';
  const encounterId = searchParams.get('encounter_id') || 'ENC-001';

  const [destinationHospital, setDestinationHospital] = useState('Anand District General Hospital');
  const [department, setDepartment] = useState('Emergency & Critical Care');
  const [reason, setReason] = useState('Severe Hypoxia (SpO2: 88%) and Hypertensive Emergency (BP: 185/115 mmHg)');
  const [urgency, setUrgency] = useState('High');
  const [referralResult, setReferralResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { queueOfflineAction } = useOfflineSync();
  const router = useRouter();

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const refNum = `REF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const qrData = `SWASTHYASETU:REF:${refNum}:PATIENT:${patientId}:ENC:${encounterId}`;

    const payload = {
      patient_id: patientId,
      encounter_id: encounterId,
      destination_department: department,
      referral_reason: reason,
      urgency,
      qr_code_data: qrData
    };

    if (navigator.onLine) {
      try {
        const res = await apiClient.post('/referrals', payload);
        setReferralResult(res.data);
      } catch (err) {
        saveOfflineReferral(refNum, payload, qrData);
      }
    } else {
      saveOfflineReferral(refNum, payload, qrData);
    }
    setLoading(false);
  };

  const saveOfflineReferral = async (refNum: string, payload: any, qrData: string) => {
    const refObj = {
      id: `REF-LOCAL-${Date.now()}`,
      referral_number: refNum,
      ...payload,
      qr_code_data: qrData,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    setReferralResult(refObj);
    await queueOfflineAction('Referral', refObj.id, 'CREATE', payload);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center no-print shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900">Referral & Patient Transfer Management</h1>
          <p className="text-xs text-slate-500">Transfer high-risk patients with embedded digital QR verification</p>
        </div>

        <button
          onClick={() => router.back()}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {!referralResult ? (
        <form onSubmit={handleCreateReferral} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 no-print shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" /> Create Patient Referral
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Destination Referral Hospital</label>
            <input
              type="text"
              required
              value={destinationHospital}
              onChange={(e) => setDestinationHospital(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Destination Department</label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Referral Reason</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Level</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
            >
              <option value="High">High (Immediate Emergency Transfer)</option>
              <option value="Medium">Medium (Within 24 Hours)</option>
              <option value="Low">Low (Routine Specialist Review)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
          >
            {loading ? 'Generating Digital Referral...' : 'Generate Digital Referral & QR Code'}
          </button>
        </form>
      ) : (
        /* Printable A4 Referral Form Layout */
        <div className="bg-white text-slate-950 p-8 rounded-2xl border border-slate-300 space-y-6 shadow-xl print-only">
          {/* Form Header */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">SWASTHYASETU AI HEALTHCARE NETWORK</h1>
              <p className="text-xs text-slate-600">Official Clinical Referral & Emergency Patient Transfer Document</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-500 block">REFERRAL NUMBER</span>
              <strong className="text-sm font-mono font-black text-rose-600">{referralResult.referral_number}</strong>
            </div>
          </div>

          {/* Patient Summary */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block font-bold">Patient Identifier:</span>
              <strong className="text-slate-900 font-mono text-sm">{patientId}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-bold">Transfer Date & Time:</span>
              <strong className="text-slate-900">{new Date(referralResult.created_at || Date.now()).toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-bold">Destination Facility:</span>
              <strong className="text-slate-900">{destinationHospital} ({department})</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-bold">Urgency Priority:</span>
              <strong className="text-rose-600 font-bold uppercase">{referralResult.urgency} URGENCY</strong>
            </div>
          </div>

          {/* Clinical Reason */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Clinical Reason for Transfer</h3>
            <p className="text-xs text-slate-900 bg-slate-100 p-3 rounded-lg border border-slate-300 font-mono">
              {referralResult.referral_reason}
            </p>
          </div>

          {/* Digital QR Code Verification Box */}
          <div className="flex justify-between items-center border-t border-slate-300 pt-6">
            <div className="space-y-1 max-w-md">
              <h4 className="text-xs font-bold text-slate-900">Hospital Admission Digital Verification QR</h4>
              <p className="text-[11px] text-slate-600">
                Receiving doctors can scan this QR code upon arrival to instantly fetch the complete clinical encounter timeline, symptoms, and vital history.
              </p>
            </div>

            <div className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-md">
              <QRCodeSVG value={referralResult.qr_code_data} size={110} level="H" />
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-slate-600 border-t border-slate-200">
            <div>
              <p className="font-bold text-slate-900">Referring Healthcare Worker Signature</p>
              <div className="h-12 border-b border-dashed border-slate-400"></div>
            </div>
            <div>
              <p className="font-bold text-slate-900">Receiving Medical Officer Signature</p>
              <div className="h-12 border-b border-dashed border-slate-400"></div>
            </div>
          </div>

          {/* Print Button (Hidden on Print output) */}
          <div className="pt-4 no-print flex justify-end gap-3">
            <button
              onClick={() => setReferralResult(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
            >
              Create Another Referral
            </button>

            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
            >
              <Printer className="w-4 h-4" /> Print A4 Referral Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
