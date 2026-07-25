'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Users, UserPlus, Building, MapPin, FileSpreadsheet, FileText, Download, ShieldCheck, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
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

  const handleExport = (type: string) => {
    window.open(`http://localhost:8000/api/v1/export/${type}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Administrative Dashboard</h1>
          <p className="text-xs text-slate-400">Manage user accounts, system configuration, hospital stats, and reports</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 text-slate-200"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 text-emerald-400"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold rounded-lg text-slate-950 flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block">Total Patients</span>
          <strong className="text-2xl font-black text-white">{stats?.metrics?.total_patients || 0}</strong>
        </div>
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block">Total Encounters</span>
          <strong className="text-2xl font-black text-emerald-400">{stats?.metrics?.total_encounters || 0}</strong>
        </div>
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block">Emergency RED Cases</span>
          <strong className="text-2xl font-black text-rose-500">{stats?.triage_distribution?.red || 0}</strong>
        </div>
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block">Active Users</span>
          <strong className="text-2xl font-black text-indigo-400">{usersList.length}</strong>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">System User Accounts</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Create Doctor / Worker Account
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Full Name</th>
                <th className="p-3">Username</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">First Login Password Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-white">{u.full_name}</td>
                  <td className="p-3 font-mono">{u.username}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'Admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      u.role === 'Doctor' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-semibold">{u.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="p-3">{u.requires_password_change ? 'Pending' : 'Completed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create New User Account</h3>
            <p className="text-xs text-slate-400">Healthcare Workers and Doctors are created by Admin</p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Anjali Mehta"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr_anjali"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anjali@swasthyasetu.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Healthcare Worker">Healthcare Worker (ASHA / Nurse)</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Temporary Initial Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-slate-950 rounded-xl"
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
