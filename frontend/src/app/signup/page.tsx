'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Stethoscope, User, Lock, Mail, Phone, UserCheck, Shield, ArrowRight, ArrowLeft,
  FileBadge, CheckCircle2, Hospital, Stethoscope as StethoscopeIcon, UserCog
} from 'lucide-react';

export default function SignupPage() {
  const [step, setStep] = useState(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState(''); // User ID
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalName, setHospitalName] = useState('');
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

    // Validation Rules
    if (!password || !password.trim()) {
      setError('Password is required.');
      return;
    }

    if (role === 'Doctor' && (!registrationNumber || !registrationNumber.trim() || registrationNumber.trim().toUpperCase() === 'NA')) {
      setError('Medical Registration Number is required for Doctors.');
      return;
    }

    setLoading(true);

    try {
      const regNum = role === 'Doctor' ? registrationNumber.trim() : 'NA';
      await apiClient.post('/auth/register', {
        full_name: fullName,
        username: username || email.split('@')[0],
        email: email,
        phone_number: phoneNumber,
        password: password,
        hospital_name: hospitalName || 'General Health Center',
        role: role,
        registration_number: regNum,
        employee_id: role !== 'Doctor' ? (employeeId || 'NA') : null
      });

      router.push('/pending-approval');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Personal Info' },
    { num: 2, title: 'Role Selection' },
    { num: 3, title: 'Hospital Facility' },
    { num: 4, title: 'Identity Verification' },
    { num: 5, title: 'Review & Submit' }
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-10 space-y-8"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-600 dark:bg-teal-500 rounded-2xl text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-600/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('signup_title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('signup_subtitle')}</p>
        </div>

        {/* Step Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Step {step} of 5: {stepsList[step - 1].title}</span>
            <span className="text-teal-600 dark:text-teal-400 font-mono">{step * 20}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${step * 20}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Personal & Contact Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('full_name')}</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Anjali Mehta"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">User ID</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. dr_anjali"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="anjali@swasthyasetu.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('mobile_number')}</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Role Selection */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Select Your Role</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { r: 'Healthcare Worker', title: 'ASHA / Healthcare Worker', icon: StethoscopeIcon, desc: 'Field screening & patient triage' },
                  { r: 'Nurse', title: 'Nurse / Nursing Staff', icon: Shield, desc: 'Patient care & vitals recording' },
                  { r: 'Doctor', title: 'Doctor / Physician', icon: Stethoscope, desc: 'Review emergency RED cases & clinical orders' },
                  { r: 'Admin', title: 'System Administrator', icon: UserCog, desc: 'Manage users & hospital approvals' }
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = role === item.r;
                  return (
                    <div
                      key={item.r}
                      onClick={() => setRole(item.r)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                        selected
                          ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${selected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                      <div>
                        <h4 className="text-xs font-bold">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Hospital Details */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Facility & Hospital Assignment</h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hospital Name</label>
                <div className="relative">
                  <Hospital className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter hospital name"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Identity Verification & Password */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Verification & Security</h3>

              {role === 'Doctor' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Medical Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FileBadge className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. GMC-2026-9941"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registration Number / ID</label>
                  <div className="relative">
                    <FileBadge className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      disabled
                      value="NA"
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Medical Registration Number is set to NA for {role} role.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Review Registration Request</h3>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block">Full Name:</span>
                    <strong className="text-slate-900 dark:text-white">{fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Role Requested:</span>
                    <strong className="text-teal-600 dark:text-teal-400">{role}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hospital Facility:</span>
                    <strong className="text-slate-900 dark:text-white">{hospitalName || 'General Health Center'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Registration Code:</span>
                    <strong className="text-slate-900 dark:text-white">{role === 'Doctor' ? registrationNumber : 'NA'}</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Wizard Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-md shadow-teal-600/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-teal-600/30 disabled:opacity-50"
              >
                <span>{loading ? 'Submitting...' : 'Submit Registration Request'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
