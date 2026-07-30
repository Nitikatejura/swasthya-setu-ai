'use client';
import { ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function EmergencyAlertModal({
  alerts,
  onAcknowledge,
  onSelectCase
}: {
  alerts: any[];
  onAcknowledge: (id: string) => void;
  onSelectCase?: (encounterId: string) => void;
}) {
  const { lang, t } = useTranslation();
  if (!alerts || alerts.length === 0) return null;

  const currentAlert = alerts[0];
  const alertId = currentAlert.alert_id || currentAlert.triage_id || currentAlert.id;
  const encounterId = currentAlert.encounter_id;

  const handleAck = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (alertId) {
      onAcknowledge(alertId);
    }
  };

  const handleReview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (alertId) {
      onAcknowledge(alertId);
    }
    if (encounterId && onSelectCase) {
      onSelectCase(encounterId);
    }
  };

  const isGujarati = lang === 'gu';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 relative overflow-hidden">
        {/* Top Emergency Banner */}
        <div className="flex items-center space-x-3 bg-rose-950/80 border border-rose-500/50 p-3.5 rounded-2xl">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-bounce shrink-0" />
          <div>
            <h2 className="text-lg font-black text-rose-400 uppercase tracking-wide">
              {isGujarati ? '🔴 ઈમરજન્સી લાલ ટ્રાયજ એલર્ટ' : '🔴 EMERGENCY RED TRIAGE ALERT'}
            </h2>
            <p className="text-xs text-rose-200">
              {isGujarati ? 'તાત્કાલિક તબીબી તપાસ અને ઓક્સિજન જરૂરી' : 'Immediate Medical Evaluation & Oxygen Required'}
            </p>
          </div>
        </div>

        {/* Patient Case Summary */}
        <div className="space-y-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">{t('patient_id')}:</span>
              <strong className="text-emerald-400 text-sm">{currentAlert.patient_id || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">{t('full_name')}:</span>
              <strong className="text-white text-sm">{currentAlert.patient_name || 'Emergency Patient'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">{t('age')} / {t('gender')}:</span>
              <strong className="text-slate-200">{currentAlert.age || 'N/A'} yrs / {currentAlert.gender || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">ચકાસણી સમય:</span>
              <strong className="text-slate-200">
                {currentAlert.evaluated_at ? new Date(currentAlert.evaluated_at).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700">
            <span className="text-xs text-rose-400 font-bold block mb-1">
              {isGujarati ? 'ઈમરજન્સીનું તબીબી કારણ:' : 'Clinical Reason for Emergency:'}
            </span>
            <p className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-rose-500/20 font-mono leading-relaxed">
              {currentAlert.clinical_reason || 'Severe vital signs abnormality detected.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleAck}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-2xl transition border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{t('acknowledge')}</span>
          </button>

          <button
            type="button"
            onClick={handleReview}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
          >
            <span>{isGujarati ? 'દર્દીનો કેસ તપાસો' : 'Review Patient Case'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
