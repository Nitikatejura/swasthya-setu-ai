'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, FileSpreadsheet, Download, FileText, KeyRound, CheckCircle, XCircle,
  Shield, UserCheck, Stethoscope, Activity, Building, Search, Database, Clock, RefreshCw, Eye
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();

  const [activeTab, setActiveTab] = useState<'users' | 'patients' | 'audits'>('users');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State for New User Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Healthcare Worker');
  const [password, setPassword] = useState('swasthya123');

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiClient.get('/reports/dashboard/admin');
      setStats(statsRes.data);

      const usersRes = await apiClient.get('/users');
      setUsersList(usersRes.data || []);

      const patientsRes = await apiClient.get('/patients');
      setPatientsList(patientsRes.data || []);
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Full Name,Username,Email,Role,Status\n" +
      usersList.map(u => `${u.id},"${u.full_name}",${u.username},${u.email},${u.role},${u.is_active ? 'Active' : 'Inactive'}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `swasthyasetu_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users', {
        full_name: fullName,
        username: username || email.split('@')[0],
        email: email,
        role: role,
        password: password
      });
      alert(`User ${fullName} created successfully! Default Password: ${password}`);
      setShowCreateModal(false);
      setFullName('');
      setUsername('');
      setEmail('');
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleResetPassword = async (userId: string, targetUsername: string) => {
    const isGujarati = lang === 'gu';
    const confirmMsg = isGujarati
      ? `શું તમે ખરેખર ${targetUsername} નો પાસવર્ડ રીસેટ કરીને 'swasthya123' કરવા માંગો છો?`
      : `Are you sure you want to reset password for ${targetUsername} to 'swasthya123'?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await apiClient.put(`/users/${userId}/reset-password`);
      alert(res.data.message || `Password for ${targetUsername} has been reset to 'swasthya123'.`);
      fetchData();
    } catch (e: any) {
      if (e.response?.status === 401) {
        alert('Your admin session has expired. Please sign in again.');
        window.location.href = '/login';
      } else {
        alert(e.response?.data?.detail || 'Failed to reset password');
      }
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPatients = patientsList.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGujarati = lang === 'gu';

  return (
    <div className="space-y-8">
      {/* Admin Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('admin_dashboard_title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin_dashboard_sub')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-2xl flex items-center gap-1.5 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isGujarati ? 'રિફ્રેશ કરો' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-xs font-bold text-teal-800 dark:text-teal-300 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> {t('excel_export')}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition"
          >
            <FileText className="w-3.5 h-3.5" /> {t('pdf_report')}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">{t('total_patients')}</span>
          <strong className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1 block">{patientsList.length || stats?.metrics?.total_patients || 0}</strong>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">{t('today_assessments')}</span>
          <strong className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{stats?.metrics?.total_encounters || 0}</strong>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-rose-50 dark:bg-rose-950/50 p-5 rounded-3xl border border-rose-200 dark:border-rose-800 shadow-sm">
          <span className="text-xs text-rose-700 dark:text-rose-300 font-bold block">{t('emergency_red')}</span>
          <strong className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 block">{stats?.triage_distribution?.red || 0}</strong>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">{t('active_users')}</span>
          <strong className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{usersList.length}</strong>
        </motion.div>
      </div>

      {/* Main Data Section with Interactive Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
        {/* Navigation Tabs & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isGujarati ? 'સિસ્ટમ વપરાશકર્તાઓ' : 'System Staff Users'} ({usersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'patients'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{isGujarati ? 'નોંધાયેલા દર્દીઓ' : 'Registered Patients'} ({patientsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audits')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'audits'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{isGujarati ? 'સિસ્ટમ ઓડિટ લોગ' : 'Audit Logs'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isGujarati ? 'શોધો...' : 'Search records...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <Link
              href="/dashboard/admin/pending-users"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
            >
              <Users className="w-3.5 h-3.5" /> {t('pending_approvals')}
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-600/20 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" /> {t('create_user_account')}
            </button>
          </div>
        </div>

        {/* TAB 1: SYSTEM USERS TABLE WITH RESET PASSWORD BUTTON */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">{t('table_full_name')}</th>
                  <th className="p-3.5">{t('table_username')}</th>
                  <th className="p-3.5">{t('table_email')}</th>
                  <th className="p-3.5">{t('table_role')}</th>
                  <th className="p-3.5">{t('table_status')}</th>
                  <th className="p-3.5 text-right rounded-r-xl">{t('table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <span>{u.full_name}</span>
                    </td>
                    <td className="p-3.5 font-mono">{u.username}</td>
                    <td className="p-3.5">{u.email}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200' :
                        u.role === 'Doctor' ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200' :
                        'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200'
                      }`}>
                        {u.role === 'Admin' ? t('role_admin') : u.role === 'Doctor' ? t('role_doctor') : t('role_worker')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.account_status === 'APPROVED' || u.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200'
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        {u.account_status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleResetPassword(u.id, u.username)}
                        className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold rounded-xl border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1 text-[11px] transition shadow-sm"
                        title={t('reset_password')}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{t('reset_password')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: REGISTERED PATIENTS TABLE */}
        {activeTab === 'patients' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Patient ID</th>
                  <th className="p-3.5">Patient Name</th>
                  <th className="p-3.5">Age / Gender</th>
                  <th className="p-3.5">Phone Number</th>
                  <th className="p-3.5">Blood Group</th>
                  <th className="p-3.5">Medical History</th>
                  <th className="p-3.5 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-mono font-bold text-teal-700 dark:text-teal-400">{p.patient_id}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{p.full_name}</td>
                    <td className="p-3.5">{p.age} yrs / {p.gender}</td>
                    <td className="p-3.5 font-mono">{p.phone_number || 'N/A'}</td>
                    <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">{p.blood_group || 'N/A'}</td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">{p.medical_history || 'None reported'}</td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/dashboard/worker?patient_id=${p.id}`}
                        className="px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-bold rounded-xl border border-teal-200 dark:border-teal-800 inline-flex items-center gap-1 text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: SYSTEM AUDIT TRAIL LOGS */}
        {activeTab === 'audits' && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Action</th>
                    <th className="p-3.5">Entity</th>
                    <th className="p-3.5">User ID</th>
                    <th className="p-3.5 text-right rounded-r-xl">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {(stats?.recent_audit_logs || []).map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 font-bold text-teal-600 dark:text-teal-400">{l.action}</td>
                      <td className="p-3.5 text-slate-900 dark:text-white">{l.entity}</td>
                      <td className="p-3.5 text-slate-500">{l.user_id?.slice(0, 8)}...</td>
                      <td className="p-3.5 text-right text-slate-400">{l.timestamp ? new Date(l.timestamp).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Creating New User Account */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('create_user_account')}</h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('full_name')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('username')}</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('table_role')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Healthcare Worker">{t('role_worker')}</option>
                  <option value="Doctor">{t('role_doctor')}</option>
                  <option value="Admin">{t('role_admin')}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
