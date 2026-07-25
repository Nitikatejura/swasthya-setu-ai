'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function EmergencyAlertModal({ alerts, onAcknowledge }: { alerts: any[]; onAcknowledge: (id: string) => void }) {
  if (!alerts || alerts.length === 0) return null;

  const currentAlert = alerts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 relative overflow-hidden">
        {/* Top Emergency Banner */}
        <div className="flex items-center space-x-3 bg-rose-950/80 border border-rose-500/50 p-3 rounded-xl">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-bounce" />
          <div>
            <h2 className="text-lg font-black text-rose-400 uppercase tracking-wide">🔴 EMERGENCY RED TRIAGE ALERT</h2>
            <p className="text-xs text-rose-200">Immediate Medical Evaluation Required</p>
          </div>
        </div>

        {/* Patient Case Summary */}
        <div className="space-y-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Patient ID:</span>
              <strong className="text-emerald-400 text-sm">{currentAlert.patient_id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Patient Name:</span>
              <strong className="text-white text-sm">{currentAlert.patient_name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Age / Gender:</span>
              <strong className="text-slate-200">{currentAlert.age} yrs / {currentAlert.gender}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Assessment Time:</span>
              <strong className="text-slate-200">{new Date(currentAlert.evaluated_at).toLocaleTimeString()}</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700">
            <span className="text-xs text-rose-400 font-bold block mb-1">Clinical Reason for Emergency:</span>
            <p className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded border border-rose-500/20 font-mono">
              {currentAlert.clinical_reason}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={() => onAcknowledge(currentAlert.alert_id)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition border border-slate-700 flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Acknowledge Alert</span>
          </button>

          <Link
            href={`/dashboard/doctor?patient=${currentAlert.encounter_id}`}
            onClick={() => onAcknowledge(currentAlert.alert_id)}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
          >
            <span>Review Patient Case</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
