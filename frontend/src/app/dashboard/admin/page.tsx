'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, FileSpreadsheet, Download, RefreshCw, UserPlus, ShieldCheck, Activity, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
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
      const statsRes = await apiClient.get('/analytics/dashboard/stats');
      setStats(statsRes.data);

      const usersRes = await apiClient.get('/users/list');
      setUsersList(usersRes.data);
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
      await apiClient.post('/users/register', {
        full_name: fullName,
        username,
        email,
        role,
        password
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

  return (
    <div className="space-y-8">
      {/* Admin Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('admin_dashboard_title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin_dashboard_sub')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-2xl flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" /> {t('csv_export')}
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
          <strong className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">{stats?.metrics?.total_patients || 0}</strong>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">{t('today_assessments')}</span>
          <strong className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1 block">{stats?.metrics?.total_encounters || 0}</strong>
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

      {/* User Management Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('active_system_users')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/admin/pending-users"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Users className="w-4 h-4" /> {t('pending_approvals')}
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-md shadow-teal-600/20"
            >
              <UserPlus className="w-4 h-4" /> {t('create_user_account')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5 rounded-l-xl">{t('table_full_name')}</th>
                <th className="p-3.5">{t('table_username')}</th>
                <th className="p-3.5">{t('table_email')}</th>
                <th className="p-3.5">{t('table_role')}</th>
                <th className="p-3.5">{t('table_status')}</th>
                <th className="p-3.5">{t('table_password_state')}</th>
                <th className="p-3.5 text-right rounded-r-xl">{t('table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{u.full_name}</td>
                  <td className="p-3.5 font-mono">{u.username}</td>
                  <td className="p-3.5">{u.email}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                      u.role === 'Doctor' ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800' :
                      'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                    }`}>
                      {u.role === 'Admin' ? t('role_admin') : u.role === 'Doctor' ? t('role_doctor') : t('role_worker')}
                    </span>
                  </td>
                  <td className="p-3.5 text-teal-600 dark:text-teal-400 font-semibold">{u.is_active ? t('status_active') : t('status_pending')}</td>
                  <td className="p-3.5">{u.requires_password_change ? t('status_pending') : t('pwd_completed')}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={async () => {
                        if (confirm(`Reset password for ${u.full_name} (${u.username}) to default 'swasthya123'?`)) {
                          try {
                            const res = await apiClient.put(`/users/${u.id}/reset-password`);
                            alert(res.data.message);
                            fetchData();
                          } catch (e: any) {
                            alert(e.response?.data?.detail || 'Password reset failed');
                          }
                        }
                      }}
                      className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-[11px] font-bold rounded-xl border border-amber-200 dark:border-amber-800 transition"
                    >
                      {t('reset_password')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('create_user_account')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Healthcare Workers and Doctors are created directly by Admin</p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('full_name')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Anjali Mehta"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('username')}</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr_anjali"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('table_email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anjali@swasthyasetu.org"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('select_role')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                >
                  <option value="Healthcare Worker">{t('role_worker')}</option>
                  <option value="Doctor">{t('role_doctor')}</option>
                  <option value="Admin">{t('role_admin')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md"
                >
                  {t('create_user_account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
