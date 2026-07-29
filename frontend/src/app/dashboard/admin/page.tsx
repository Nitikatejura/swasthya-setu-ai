'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Users, UserPlus, FileSpreadsheet, FileText, Download } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Healthcare Worker');
  const [password, setPassword] = useState('swasthya123');

  const fetchData = async () => {
    try {
      const statsRes = await apiClient.get('/reports/dashboard/admin');
      setStats(statsRes.data);

      const usersRes = await apiClient.get('/users');
      setUsersList(usersRes.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users', {
        full_name: fullName,
        username,
        email,
        password,
        role
      });
      setShowCreateModal(false);
      setFullName('');
      setUsername('');
      setEmail('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleExport = async (type: string) => {
    try {
      const res = await apiClient.get(`/export/${type}`, { responseType: 'blob' });
      const fileExtension = type === 'excel' ? 'xlsx' : type === 'pdf' ? 'pdf' : 'csv';
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `swasthya_setu_report_${Date.now()}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download report.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Administrative Dashboard</h1>
          <p className="text-xs text-slate-500">Manage user accounts, system configuration, hospital stats, and reports</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1 text-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1 text-emerald-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold rounded-lg text-white flex items-center gap-1 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" /> PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold block">{t('total_patients')}</span>
          <strong className="text-2xl font-black text-slate-900">{stats?.metrics?.total_patients || 0}</strong>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold block">{t('today_assessments')}</span>
          <strong className="text-2xl font-black text-emerald-600">{stats?.metrics?.total_encounters || 0}</strong>
        </div>
        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
          <span className="text-xs text-rose-700 font-bold block">{t('emergency_red')}</span>
          <strong className="text-2xl font-black text-rose-600">{stats?.triage_distribution?.red || 0}</strong>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold block">{t('active_users')}</span>
          <strong className="text-2xl font-black text-indigo-600">{usersList.length}</strong>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">{t('active_users')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/admin/pending-users"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Users className="w-4 h-4" /> {t('pending_approvals')}
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <UserPlus className="w-4 h-4" /> Create User Account
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Full Name</th>
                <th className="p-3">Username</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Password State</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{u.full_name}</td>
                  <td className="p-3 font-mono">{u.username}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'Admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      u.role === 'Doctor' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-600 font-semibold">{u.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="p-3">{u.requires_password_change ? 'Pending' : 'Completed'}</td>
                  <td className="p-3 text-right">
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
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200 transition"
                    >
                      Reset Password
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Create New User Account</h3>
            <p className="text-xs text-slate-500">Healthcare Workers and Doctors are created by Admin</p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Anjali Mehta"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr_anjali"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anjali@swasthyasetu.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                >
                  <option value="Healthcare Worker">Healthcare Worker (ASHA / Nurse)</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Initial Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-emerald-700 font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
