"""Initial schema migration

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-28 11:26:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Hospitals table
    op.create_table(
        'hospitals',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )

    # Villages table
    op.create_table(
        'villages',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('block', sa.String(length=100), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False)
    )

    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False, unique=True, index=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id'), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('requires_password_change', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )

    # Patients table
    op.create_table(
        'patients',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('patient_id', sa.String(length=50), nullable=False, unique=True, index=True),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(length=20), nullable=False),
        sa.Column('date_of_birth', sa.String(length=20), nullable=True),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact', sa.String(length=255), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('village_id', sa.String(length=36), sa.ForeignKey('villages.id'), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('height', sa.Float(), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('medical_history', sa.Text(), nullable=True),
        sa.Column('pregnancy_status', sa.String(length=50), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), default=False),
        sa.Column('created_by', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )

    # Encounters table
    op.create_table(
        'encounters',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('healthcare_worker_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('visit_date', sa.DateTime(), nullable=True),
        sa.Column('encounter_status', sa.String(length=50), default='Completed'),
        sa.Column('is_reviewed', sa.Boolean(), default=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )

    # Symptoms table
    op.create_table(
        'symptoms',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('encounter_id', sa.String(length=36), sa.ForeignKey('encounters.id'), nullable=False),
        sa.Column('chief_complaint', sa.Text(), nullable=False),
        sa.Column('symptom_name', sa.String(length=255), nullable=False),
        sa.Column('duration', sa.String(length=100), nullable=True),
        sa.Column('severity', sa.String(length=50), nullable=True),
        sa.Column('additional_notes', sa.Text(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=True)
    )

    # Vitals table
    op.create_table(
        'vitals',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('encounter_id', sa.String(length=36), sa.ForeignKey('encounters.id'), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=True),
        sa.Column('pulse_rate', sa.Integer(), nullable=True),
        sa.Column('systolic_bp', sa.Integer(), nullable=True),
        sa.Column('diastolic_bp', sa.Integer(), nullable=True),
        sa.Column('respiratory_rate', sa.Integer(), nullable=True),
        sa.Column('spo2', sa.Float(), nullable=True),
        sa.Column('blood_sugar', sa.Float(), nullable=True),
        sa.Column('height', sa.Float(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('bmi', sa.Float(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=True)
    )

    # Triage Records table
    op.create_table(
        'triage_records',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('encounter_id', sa.String(length=36), sa.ForeignKey('encounters.id'), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('matched_rules', sa.Text(), nullable=False),
        sa.Column('clinical_reason', sa.Text(), nullable=False),
        sa.Column('recommended_actions', sa.Text(), nullable=False),
        sa.Column('guideline_used', sa.String(length=100), default='india_nhm'),
        sa.Column('is_acknowledged_by_doctor', sa.Boolean(), default=False),
        sa.Column('acknowledged_by', sa.String(length=36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('evaluated_at', sa.DateTime(), nullable=True)
    )

    # Referrals table
    op.create_table(
        'referrals',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('referral_number', sa.String(length=50), nullable=False, unique=True, index=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('encounter_id', sa.String(length=36), sa.ForeignKey('encounters.id'), nullable=False),
        sa.Column('triage_record_id', sa.String(length=36), sa.ForeignKey('triage_records.id'), nullable=True),
        sa.Column('referring_user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('destination_hospital_id', sa.String(length=36), sa.ForeignKey('hospitals.id'), nullable=True),
        sa.Column('destination_department', sa.String(length=100), nullable=True),
        sa.Column('referral_reason', sa.Text(), nullable=False),
        sa.Column('urgency', sa.String(length=20), default='High'),
        sa.Column('referral_notes', sa.Text(), nullable=True),
        sa.Column('qr_code_data', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=30), default='Pending'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )

    # Doctor Notes table
    op.create_table(
        'doctor_notes',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('encounter_id', sa.String(length=36), sa.ForeignKey('encounters.id'), nullable=False),
        sa.Column('doctor_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=False),
        sa.Column('diagnosis_impression', sa.Text(), nullable=True),
        sa.Column('treatment_plan', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )

    # Notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=20), default='INFO'),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )

    # Audit Logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.String(length=100), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('device_info', sa.String(length=255), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True)
    )

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('doctor_notes')
    op.drop_table('referrals')
    op.drop_table('triage_records')
    op.drop_table('vitals')
    op.drop_table('symptoms')
    op.drop_table('encounters')
    op.drop_table('patients')
    op.drop_table('users')
    op.drop_table('villages')
    op.drop_table('hospitals')
