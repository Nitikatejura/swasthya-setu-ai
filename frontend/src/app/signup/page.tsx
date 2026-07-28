'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { Stethoscope, User, Lock, Mail, Phone, UserCheck, Shield, ArrowRight, Building, FileBadge, IdentificationCard } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalName, setHospitalName] = useState('Anand District General Hospital');
  const [role, setRole] = useState('Healthcare Worker');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/register', {
        full_name: fullName,
        username: username || email.split('@')[0],
        email: email,
        phone_number: phoneNumber,
        password: password,
        hospital_name: hospitalName,
        role: role,
        registration_number: role === 'Doctor' ? registrationNumber : null,
        employee_id: role !== 'Doctor' ? employeeId : null
      });

      router.push('/pending-approval');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('signup_title')}</h1>
          <p className="text-xs text-slate-500">{t('signup_subtitle')}</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('full_name')}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anjali Mehta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('username')}</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. dr_anjali"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="anjali@swasthyasetu.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('mobile_number')}</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('hospital_facility')}</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand District Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('select_role')}</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition cursor-pointer"
                >
                  <option value="Healthcare Worker">{t('role_worker')}</option>
                  <option value="Doctor">{t('role_doctor')}</option>
                  <option value="Admin">{t('role_admin')}</option>
                </select>
              </div>
            </div>
          </div>

          {role === 'Doctor' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('doctor_reg_no')}</label>
              <div className="relative">
                <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. GMC-2026-9941"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('worker_emp_id')}</label>
              <div className="relative">
                <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. ASHA-MOGRI-882"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('password')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder={t('password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <span>{loading ? 'Submitting Registration...' : t('submit_registration')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {t('already_have_account')}{' '}
            <Link href="/login" className="font-bold text-emerald-600 hover:underline">
              {t('sign_in_here')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
