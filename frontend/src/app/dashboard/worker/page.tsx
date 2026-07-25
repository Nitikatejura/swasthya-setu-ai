'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { offlineDb } from '@/db/offlineDb';
import Link from 'next/link';
import { UserPlus, Search, Stethoscope, Activity, Calendar, MapPin, ArrowRight } from 'lucide-react';

export default function WorkerDashboard() {
  const { user } = useAuth();
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
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Healthcare Worker Portal</h1>
          <p className="text-xs text-slate-400">Register village patients, record symptoms & vitals, and generate triage assessments</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <UserPlus className="w-4 h-4" /> Register New Patient
          </button>
        </div>
      </div>

      {/* Patient Search & List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-400" /> Patient Registry
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Patient ID, Name, Phone..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {patients.map((p) => (
            <div key={p.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-slate-700 transition">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {p.patient_id}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{p.full_name}</h3>
                  <p className="text-xs text-slate-400">{p.age} yrs &bull; {p.gender} &bull; Blood: {p.blood_group || 'N/A'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>Phone: <strong className="text-slate-200">{p.phone_number || 'N/A'}</strong></p>
                <p>Pregnancy: <strong className="text-slate-200">{p.pregnancy_status || 'N/A'}</strong></p>
              </div>

              <div className="pt-2 border-t border-slate-900">
                <Link
                  href={`/assessment?patient_id=${p.id}&patient_name=${encodeURIComponent(p.full_name)}&patient_code=${p.patient_id}`}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                >
                  <Activity className="w-4 h-4" /> Start AI Assessment & Vitals
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Register New Patient</h3>

            <form onSubmit={handleRegisterPatient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="45"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Pregnancy Status</label>
                <select
                  value={pregnancyStatus}
                  onChange={(e) => setPregnancyStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Not Pregnant">Not Pregnant</option>
                  <option value="Pregnant (Trimester 1)">Pregnant (Trimester 1)</option>
                  <option value="Pregnant (Trimester 2)">Pregnant (Trimester 2)</option>
                  <option value="Pregnant (Trimester 3)">Pregnant (Trimester 3)</option>
                  <option value="Postpartum">Postpartum</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-slate-950 rounded-xl"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
