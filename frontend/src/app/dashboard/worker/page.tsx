'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { offlineDb } from '@/db/offlineDb';
import Link from 'next/link';
import { UserPlus, Search, Stethoscope, Activity, User, Phone as PhoneIcon, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [bloodGroup, setBloodGroup] = useState('Not specified');

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

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = `SS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const bgToStore = (!bloodGroup || bloodGroup === 'Not specified') ? 'Unknown' : bloodGroup;
    const patientData = {
      full_name: fullName,
      age: parseInt(age),
      gender,
      phone_number: phone,
      emergency_contact: emergencyContact,
      blood_group: bgToStore,
      pregnancy_status: 'Not Applicable',
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('worker_dashboard')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('tagline')} &bull; Logged in as {user?.full_name || 'ASHA Worker'}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition shadow-md shadow-teal-600/20"
          >
            <UserPlus className="w-4 h-4" /> {t('register_patient')}
          </button>
        </div>
      </div>

      {/* Patient Search & Directory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" /> {t('total_patients')}
          </h2>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search_patients')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {patients.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-5 rounded-3xl space-y-3.5 hover:border-teal-400 dark:hover:border-teal-600 transition shadow-sm group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/80 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                    {p.patient_id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">{p.full_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{p.age} {t('age')} &bull; {p.gender} &bull; {t('blood_group')}: {p.blood_group || 'N/A'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p className="flex items-center gap-1.5">
                  <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('phone')}: <strong className="text-slate-900 dark:text-white">{p.phone_number || 'N/A'}</strong></span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <Link
                  href={`/assessment?patient_id=${p.id}&patient_name=${encodeURIComponent(p.full_name)}&patient_code=${p.patient_id}`}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Activity className="w-4 h-4" /> {t('start_assessment')}
                </Link>
                <Link
                  href={`/patient/${p.id}/timeline`}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center transition border border-slate-200 dark:border-slate-600"
                  title={t('view_timeline')}
                >
                  {t('view_timeline')}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('register_patient')}</h3>

            <form onSubmit={handleRegisterPatient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('full_name')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('age')}</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="45"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('gender')}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('phone')}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-2xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-xs font-bold text-white rounded-2xl shadow-md"
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
