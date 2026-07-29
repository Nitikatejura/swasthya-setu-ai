'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { offlineDb } from '@/db/offlineDb';
import Link from 'next/link';
import { UserPlus, Search, Stethoscope, Activity } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form states for registering new patient
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [pregnancyStatus, setPregnancyStatus] = useState('Not Pregnant');

  const fetchPatients = async () => {
    try {
      if (navigator.onLine) {
        const res = await apiClient.get(`/patients?query=${searchTerm}`);
        setPatients(res.data);
      } else {
        const local = await offlineDb.patients.toArray();
        setPatients(local);
      }
    } catch (e) {
      const local = await offlineDb.patients.toArray();
      setPatients(local);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = `SS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const patientData = {
      full_name: fullName,
      age: parseInt(age),
      gender,
      phone_number: phone,
      emergency_contact: emergencyContact,
      blood_group: bloodGroup,
      pregnancy_status: pregnancyStatus,
      created_by: user?.id || 'offline_worker'
    };

    if (navigator.onLine) {
      try {
        await apiClient.post('/patients', patientData);
      } catch (e) {
        await saveOfflinePatient(pid, patientData);
      }
    } else {
      await saveOfflinePatient(pid, patientData);
    }

    setShowRegisterModal(false);
    setFullName('');
    setAge('');
    setPhone('');
    fetchPatients();
  };

  const saveOfflinePatient = async (pid: string, data: any) => {
    const localId = `PAT-${Date.now()}`;
    await offlineDb.patients.add({
      id: localId,
      patient_id: pid,
      ...data,
      is_synced: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    await offlineDb.syncQueue.add({
      queue_id: `Q-${Date.now()}`,
      entity_type: 'Patient',
      entity_id: localId,
      operation: 'CREATE',
      payload: data,
      status: 'PENDING',
      retry_count: 0,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-8">
      {/* Worker Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('worker_dashboard')}</h1>
          <p className="text-xs text-slate-500">{t('tagline')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4" /> {t('register_patient')}
          </button>
        </div>
      </div>

      {/* Patient Search & List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" /> {t('total_patients')}
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search_patients')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
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
                  <p className="text-xs text-slate-500">{p.age} {t('age')} &bull; {p.gender} &bull; {t('blood_group')}: {p.blood_group || 'N/A'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>{t('phone')}: <strong className="text-slate-900">{p.phone_number || 'N/A'}</strong></p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                <Link
                  href={`/assessment?patient_id=${p.id}&patient_name=${encodeURIComponent(p.full_name)}&patient_code=${p.patient_id}`}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Activity className="w-4 h-4" /> {t('start_assessment')}
                </Link>
                <Link
                  href={`/patient/${p.id}/timeline`}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center transition border border-slate-200"
                  title={t('view_timeline')}
                >
                  {t('view_timeline')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">{t('register_patient')}</h3>

            <form onSubmit={handleRegisterPatient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('full_name')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('age')}</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="45"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('gender')}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md"
                >
                  {t('register_patient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
