from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# -------------------------------------------------------------------
# AUTH & USER SCHEMAS
# -------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class UserCreate(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    phone_number: Optional[str] = None
    password: str
    role: str  # Admin, Doctor, Healthcare Worker
    hospital_id: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    hospital_id: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    phone_number: Optional[str] = None
    role: str
    hospital_id: Optional[str] = None
    is_active: bool
    requires_password_change: bool
    created_at: datetime

    class Config:
        from_attributes = True

# -------------------------------------------------------------------
# HOSPITAL & VILLAGE SCHEMAS
# -------------------------------------------------------------------
class HospitalCreate(BaseModel):
    name: str
    code: str
    district: str
    state: str

class HospitalResponse(BaseModel):
    id: str
    name: str
    code: str
    district: str
    state: str

    class Config:
        from_attributes = True

class VillageCreate(BaseModel):
    name: str
    block: str
    district: str
    state: str

class VillageResponse(BaseModel):
    id: str
    name: str
    block: str
    district: str
    state: str

    class Config:
        from_attributes = True

# -------------------------------------------------------------------
# PATIENT SCHEMAS
# -------------------------------------------------------------------
class PatientCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    date_of_birth: Optional[str] = None
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    village_id: Optional[str] = None
    address: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    pregnancy_status: Optional[str] = None
    photo_url: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    village_id: Optional[str] = None
    address: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    pregnancy_status: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    patient_id: str
    full_name: str
    age: int
    gender: str
    date_of_birth: Optional[str] = None
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    village_id: Optional[str] = None
    village: Optional[VillageResponse] = None
    address: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    pregnancy_status: Optional[str] = None
    photo_url: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -------------------------------------------------------------------
# ASSESSMENT: SYMPTOMS & VITALS & ENCOUNTER SCHEMAS
# -------------------------------------------------------------------
class SymptomCreate(BaseModel):
    chief_complaint: str
    symptom_name: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    additional_notes: Optional[str] = None

class SymptomResponse(BaseModel):
    id: str
    encounter_id: str
    chief_complaint: str
    symptom_name: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    additional_notes: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

class VitalCreate(BaseModel):
    temperature: Optional[float] = None
    pulse_rate: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    respiratory_rate: Optional[int] = None
    spo2: Optional[float] = None
    blood_sugar: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None

class VitalResponse(BaseModel):
    id: str
    encounter_id: str
    temperature: Optional[float] = None
    pulse_rate: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    respiratory_rate: Optional[int] = None
    spo2: Optional[float] = None
    blood_sugar: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

class TriageRecordResponse(BaseModel):
    id: str
    encounter_id: str
    priority: str
    matched_rules: str
    clinical_reason: str
    recommended_actions: str
    guideline_used: str
    is_acknowledged_by_doctor: bool
    evaluated_at: datetime

    class Config:
        from_attributes = True

class EncounterCreate(BaseModel):
    patient_id: str
    notes: Optional[str] = None
    symptoms: List[SymptomCreate] = []
    vitals: Optional[VitalCreate] = None

class EncounterResponse(BaseModel):
    id: str
    patient_id: str
    healthcare_worker_id: str
    visit_date: datetime
    encounter_status: str
    is_reviewed: bool
    notes: Optional[str] = None
    patient: Optional[PatientResponse] = None
    symptoms: List[SymptomResponse] = []
    vitals: List[VitalResponse] = []
    triage_record: Optional[TriageRecordResponse] = None

    class Config:
        from_attributes = True

# -------------------------------------------------------------------
# AI & TRIAGE SCHEMAS
# -------------------------------------------------------------------
class AIChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    language: str = "English"

class TriageEvaluateRequest(BaseModel):
    encounter_id: str
    guideline: str = "india_nhm"

# -------------------------------------------------------------------
# DOCTOR NOTES & REFERRALS SCHEMAS
# -------------------------------------------------------------------
class DoctorNoteCreate(BaseModel):
    encounter_id: str
    notes: str
    diagnosis_impression: Optional[str] = None
    treatment_plan: Optional[str] = None

class ReferralCreate(BaseModel):
    patient_id: str
    encounter_id: str
    destination_hospital_id: Optional[str] = None
    destination_department: Optional[str] = None
    referral_reason: str
    urgency: str = "High"
    referral_notes: Optional[str] = None

class ReferralResponse(BaseModel):
    id: str
    referral_number: str
    patient_id: str
    encounter_id: str
    triage_record_id: Optional[str] = None
    referring_user_id: str
    destination_hospital_id: Optional[str] = None
    destination_department: Optional[str] = None
    referral_reason: str
    urgency: str
    referral_notes: Optional[str] = None
    qr_code_data: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True

# -------------------------------------------------------------------
# SYNC & CONFLICT SCHEMAS
# -------------------------------------------------------------------
class SyncQueueItem(BaseModel):
    queue_id: str
    entity_type: str  # Patient, Encounter, Vital, Symptom, Referral
    entity_id: str
    operation: str    # CREATE, UPDATE, DELETE
    payload: Dict[str, Any]
    timestamp: str

class SyncUploadRequest(BaseModel):
    items: List[SyncQueueItem]

class SyncDownloadResponse(BaseModel):
    patients: List[PatientResponse]
    encounters: List[EncounterResponse]
    referrals: List[ReferralResponse]
    server_timestamp: str

class ConflictResolutionRequest(BaseModel):
    entity_type: str
    entity_id: str
    resolution_choice: str  # "KEEP_LOCAL" or "KEEP_SERVER"
    merged_payload: Optional[Dict[str, Any]] = None
