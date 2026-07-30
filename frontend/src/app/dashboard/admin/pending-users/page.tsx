'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { UserCheck, UserX, Clock, ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PendingUsersPage() {
  const { t } = useTranslation();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/pending/list');
      setPendingUsers(res.data);
    } catch (e) {
      console.error('Failed to fetch pending registration requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (user: any) => {
    if (!confirm(`Are you sure you want to approve ${user.full_name} (${user.role})?`)) return;

    try {
      await apiClient.put(`/users/${user.id}/approval`, {
        status: 'APPROVED'
      });
      alert(`Account for ${user.full_name} approved successfully!`);
      fetchPending();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Approval failed');
    }
  };

  const handleOpenRejectModal = (user: any) => {
    setSelectedUser(user);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.put(`/users/${selectedUser.id}/approval`, {
        status: 'REJECTED',
        rejected_reason: rejectionReason
      });
      alert(`Registration request for ${selectedUser.full_name} has been rejected.`);
      setRejectModalOpen(false);
      fetchPending();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('pending_reg_title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('pending_reg_sub')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPending}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-2xl flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('refresh_list')}
          </button>

          <Link
            href="/dashboard/admin"
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold rounded-2xl flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> {t('return_admin_overview')}
          </Link>
        </div>
      </div>

      {/* Pending Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> {t('pending_approvals')} ({pendingUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">Loading pending applications...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <CheckCircle className="w-12 h-12 text-teal-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Pending Requests</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">All user registration requests have been reviewed and processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">{t('table_applicant')}</th>
                  <th className="p-3.5">{t('table_role')}</th>
                  <th className="p-3.5">{t('table_facility')}</th>
                  <th className="p-3.5">{t('table_reg_id')}</th>
                  <th className="p-3.5">{t('table_email')}</th>
                  <th className="p-3.5">{t('table_submitted')}</th>
                  <th className="p-3.5 text-right rounded-r-xl">{t('table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5">
                      <strong className="text-slate-900 dark:text-white block font-bold">{u.full_name}</strong>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">@{u.username}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Doctor' ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800' :
                        'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      }`}>
                        {u.role === 'Doctor' ? t('role_doctor') : t('role_worker')}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">{u.hospital_name || 'Anand General Hospital'}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {u.role === 'Doctor' ? u.registration_number || 'N/A' : u.employee_id || 'N/A'}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-500">{u.phone_number || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(u)}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> {t('approve_btn')}
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(u)}
                          className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1 transition"
                        >
                          <UserX className="w-3.5 h-3.5" /> {t('reject_btn')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Reject Registration Request</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Rejecting registration for <strong>{selectedUser.full_name}</strong> ({selectedUser.email}). Please enter a reason.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rejection Reason (Required)</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid Gujarat Medical Council Registration Number / Employee ID unverified."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
