import Dexie, { Table } from 'dexie';

export interface LocalPatient {
  id: string;
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  phone_number?: string;
  emergency_contact?: string;
  blood_group?: string;
  village_id?: string;
  address?: string;
  weight?: number;
  height?: number;
  allergies?: string;
  medical_history?: string;
  pregnancy_status?: string;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalEncounter {
  id: string;
  patient_id: string;
  healthcare_worker_id: string;
  visit_date: string;
  encounter_status: string;
  is_reviewed: boolean;
  notes?: string;
  is_synced: boolean;
}

export interface LocalSymptom {
  id: string;
  encounter_id: string;
  chief_complaint: string;
  symptom_name: string;
  duration?: string;
  severity?: string;
  additional_notes?: string;
}

export interface LocalVital {
  id: string;
  encounter_id: string;
  temperature?: number;
  pulse_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  respiratory_rate?: number;
  spo2?: number;
  blood_sugar?: number;
  height?: number;
  weight?: number;
  bmi?: number;
}

export interface LocalTriageRecord {
  id: string;
  encounter_id: string;
  priority: string; // RED, YELLOW, GREEN
  matched_rules: string;
  clinical_reason: string;
  recommended_actions: string;
  guideline_used: string;
  evaluated_at: string;
}

export interface LocalReferral {
  id: string;
  referral_number: string;
  patient_id: string;
  encounter_id: string;
  triage_record_id?: string;
  referring_user_id: string;
  destination_hospital_id?: string;
  destination_department?: string;
  referral_reason: string;
  urgency: string;
  referral_notes?: string;
  qr_code_data: string;
  status: string;
  created_at: string;
}

export interface SyncQueueItem {
  id?: number;
  queue_id: string;
  entity_type: 'Patient' | 'Encounter' | 'Vital' | 'Symptom' | 'Referral';
  entity_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';
  retry_count: number;
  timestamp: string;
}

export class SwasthyaSetuOfflineDB extends Dexie {
  patients!: Table<LocalPatient>;
  encounters!: Table<LocalEncounter>;
  symptoms!: Table<LocalSymptom>;
  vitals!: Table<LocalVital>;
  triageRecords!: Table<LocalTriageRecord>;
  referrals!: Table<LocalReferral>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('SwasthyaSetuDB');
    this.version(1).stores({
      patients: 'id, patient_id, full_name, phone_number, village_id, is_synced',
      encounters: 'id, patient_id, healthcare_worker_id, visit_date, is_synced',
      symptoms: 'id, encounter_id, chief_complaint',
      vitals: 'id, encounter_id',
      triageRecords: 'id, encounter_id, priority',
      referrals: 'id, referral_number, patient_id, status',
      syncQueue: '++id, queue_id, entity_type, entity_id, status, timestamp'
    });
  }
}

export const offlineDb = new SwasthyaSetuOfflineDB();
