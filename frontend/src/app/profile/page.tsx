'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { User, Mail, Phone, Building, FileBadge, ShieldCheck, CheckCircle2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone_number || '');
      setHospitalName(user.hospital_name || 'Anand District General Hospital');
      setRegistrationNumber(user.registration_number || '');
      setEmployeeId(user.employee_id || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      await apiClient.put('/users/me/profile', {
        full_name: fullName,
        phone_number: phone,
        hospital_name: hospitalName,
        registration_number: registrationNumber,
        employee_id: employeeId
      });
      setMsg('Profile updated successfully!');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Account Profile</h1>
          <p className="text-xs text-slate-500">Manage your clinical credentials, contact info, and facility details</p>
        </div>

        <Link
          href={user?.role === 'Admin' ? '/dashboard/admin' : user?.role === 'Doctor' ? '/dashboard/doctor' : '/dashboard/worker'}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{user?.full_name}</h3>
              <p className="text-xs text-slate-500">{user?.email} &bull; Role: <strong>{user?.role}</strong></p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            ACCOUNT APPROVED
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Facility</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
              />
            </div>

            {user?.role === 'Doctor' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medical Registration Number</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white font-mono"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
