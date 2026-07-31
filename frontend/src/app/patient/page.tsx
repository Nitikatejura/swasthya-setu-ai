'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { offlineDb } from '@/db/offlineDb';
import Link from 'next/link';
import { Search, Stethoscope, Activity, UserPlus, ArrowLeft } from 'lucide-react';

export default function PatientRegistryPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPatients = async () => {
    try {
      if (navigator.onLine) {
        const res = await apiClient.get(`/patients?query=${searchTerm}`);
        const serverPatients = res.data || [];
        const localPatients = await offlineDb.patients.toArray();

        const mergedMap = new Map();
        serverPatients.forEach((p: any) => mergedMap.set(p.patient_id || p.id, p));
        localPatients.forEach((lp: any) => {
          const key = lp.patient_id || lp.id;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, lp);
          }
        });
        setPatients(Array.from(mergedMap.values()));
      } else {
        const term = searchTerm.toLowerCase().trim();
        const local = await offlineDb.patients.toArray();
        const filtered = term
          ? local.filter(p =>
              p.patient_id?.toLowerCase().includes(term) ||
              p.full_name?.toLowerCase().includes(term) ||
              p.phone_number?.includes(term) ||
              p.village_id?.toLowerCase().includes(term)
            )
          : local;
        setPatients(filtered);
      }
    } catch (e) {
      const term = searchTerm.toLowerCase().trim();
      const local = await offlineDb.patients.toArray();
      const filtered = term
        ? local.filter(p =>
            p.patient_id?.toLowerCase().includes(term) ||
            p.full_name?.toLowerCase().includes(term) ||
            p.phone_number?.includes(term) ||
            p.village_id?.toLowerCase().includes(term)
          )
        : local;
      setPatients(filtered);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Systemwide Patient Registry</h1>
          <p className="text-xs text-slate-500">Search and review village patient records, encounter history, and triage status</p>
        </div>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </div>

      {/* Registry Search Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" /> Patient Registry ({patients.length})
          </h2>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Patient ID, Name, Phone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {patients.map((p) => (
            <div key={p.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 hover:border-emerald-300 transition shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {p.patient_id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{p.full_name}</h3>
                  <p className="text-xs text-slate-500">{p.age} yrs &bull; {p.gender} &bull; Blood: {p.blood_group || 'N/A'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>Phone: <strong className="text-slate-900">{p.phone_number || 'N/A'}</strong></p>
                <p>Pregnancy: <strong className="text-slate-900">{p.pregnancy_status || 'N/A'}</strong></p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <Link
                  href={`/assessment?patient_id=${p.id}&patient_name=${encodeURIComponent(p.full_name)}&patient_code=${p.patient_id}`}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Activity className="w-4 h-4" /> Start AI Assessment & Vitals
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
