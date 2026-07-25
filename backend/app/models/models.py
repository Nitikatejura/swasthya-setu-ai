import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserRole(str, Enum):
    ADMIN = "Admin"
    DOCTOR = "Doctor"
    HEALTHCARE_WORKER = "Healthcare Worker"

class UrgencyLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class ReferralStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class TriagePriority(str, Enum):
    RED = "RED"
    YELLOW = "YELLOW"
    GREEN = "GREEN"

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="hospital")

class Village(Base):
    __tablename__ = "villages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    block = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)

    patients = relationship("Patient", back_populates="village")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone_number = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.HEALTHCARE_WORKER.value)
    hospital_id = Column(String(36), ForeignKey("hospitals.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    requires_password_change = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hospital = relationship("Hospital", back_populates="users")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    date_of_birth = Column(String(20), nullable=True)
    phone_number = Column(String(20), nullable=True)
    emergency_contact = Column(String(255), nullable=True)  # encrypted string supported
    blood_group = Column(String(10), nullable=True)
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=True)
    address = Column(Text, nullable=True)
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    allergies = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    pregnancy_status = Column(String(50), nullable=True)
    photo_url = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    village = relationship("Village", back_populates="patients")
    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")

class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    healthcare_worker_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    visit_date = Column(DateTime, default=datetime.utcnow)
    encounter_status = Column(String(50), default="Completed")
    is_reviewed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="encounters")
    symptoms = relationship("Symptom", back_populates="encounter", cascade="all, delete-orphan")
    vitals = relationship("Vital", back_populates="encounter", cascade="all, delete-orphan")
    triage_record = relationship("TriageRecord", back_populates="encounter", uselist=False, cascade="all, delete-orphan")

class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=False)
    chief_complaint = Column(Text, nullable=False)
    symptom_name = Column(String(255), nullable=False)
    duration = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)
    additional_notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    encounter = relationship("Encounter", back_populates="symptoms")

class Vital(Base):
    __tablename__ = "vitals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=False)
    temperature = Column(Float, nullable=True)      # in Celsius
    pulse_rate = Column(Integer, nullable=True)      # bpm
    systolic_bp = Column(Integer, nullable=True)     # mmHg
    diastolic_bp = Column(Integer, nullable=True)    # mmHg
    respiratory_rate = Column(Integer, nullable=True)# breaths/min
    spo2 = Column(Float, nullable=True)              # percentage %
    blood_sugar = Column(Float, nullable=True)       # mg/dL
    height = Column(Float, nullable=True)            # cm
    weight = Column(Float, nullable=True)            # kg
    bmi = Column(Float, nullable=True)               # calculated
    recorded_at = Column(DateTime, default=datetime.utcnow)

    encounter = relationship("Encounter", back_populates="vitals")

class TriageRecord(Base):
    __tablename__ = "triage_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=False)
    priority = Column(String(20), nullable=False)    # RED, YELLOW, GREEN
    matched_rules = Column(Text, nullable=False)     # JSON string of list of matched rule names/details
    clinical_reason = Column(Text, nullable=False)
    recommended_actions = Column(Text, nullable=False)
    guideline_used = Column(String(100), default="india_nhm")
    is_acknowledged_by_doctor = Column(Boolean, default=False)
    acknowledged_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    encounter = relationship("Encounter", back_populates="triage_record")

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    referral_number = Column(String(50), unique=True, nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=False)
    triage_record_id = Column(String(36), ForeignKey("triage_records.id"), nullable=True)
    referring_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    destination_hospital_id = Column(String(36), ForeignKey("hospitals.id"), nullable=True)
    destination_department = Column(String(100), nullable=True)
    referral_reason = Column(Text, nullable=False)
    urgency = Column(String(20), default=UrgencyLevel.HIGH.value)
    referral_notes = Column(Text, nullable=True)
    qr_code_data = Column(Text, nullable=True)
    status = Column(String(30), default=ReferralStatus.PENDING.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DoctorNote(Base):
    __tablename__ = "doctor_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=False)
    diagnosis_impression = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), default="INFO")
    is_read = Column(Boolean, default=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    device_info = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
