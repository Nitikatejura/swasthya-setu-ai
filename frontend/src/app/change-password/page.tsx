'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setSuccess('Password changed successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-100 rounded-2xl text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">First Login: Change Password</h2>
        <p className="text-xs text-slate-500">Please set a secure new password for your account</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-700 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
          <input
            type="password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
        >
          {loading ? 'Updating Password...' : 'Update Password & Continue'}
        </button>
      </form>
    </div>
  );
}
