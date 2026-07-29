'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { UserCheck, UserX, Clock, Shield, Building, FileBadge, ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function PendingUsersPage() {
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
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Registration Requests</h1>
          <p className="text-xs text-slate-500">Review and approve new Doctor, Nurse, and ASHA Worker account applications</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPending}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh List
          </button>

          <Link
            href="/dashboard/admin"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Admin Overview
          </Link>
        </div>
      </div>

      {/* Pending Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" /> Pending Applications ({pendingUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Loading pending applications...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Pending Requests</h3>
            <p className="text-xs text-slate-500">All user registration requests have been reviewed and processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Applicant Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Hospital / Facility</th>
                  <th className="p-3">Reg # / Employee ID</th>
                  <th className="p-3">Contact Email & Phone</th>
                  <th className="p-3">Submitted Date</th>
                  <th className="p-3 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <strong className="text-slate-900 block font-bold">{u.full_name}</strong>
                      <span className="text-[11px] font-mono text-slate-500">@{u.username}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Doctor' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{u.hospital_name || 'Anand General Hospital'}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {u.role === 'Doctor' ? u.registration_number || 'N/A' : u.employee_id || 'N/A'}
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-500">{u.phone_number || 'N/A'}</div>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(u)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(u)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                        >
                          <UserX className="w-3.5 h-3.5" /> Reject
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Reject Registration Request</span>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting registration for <strong>{selectedUser.full_name}</strong> ({selectedUser.email}). Please enter a reason.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason (Required)</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid Gujarat Medical Council Registration Number / Employee ID unverified."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
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
