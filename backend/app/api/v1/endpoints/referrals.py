import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_worker, require_doctor
from app.models.models import Referral, Patient, Encounter, TriageRecord, User, AuditLog, ReferralStatus
from app.schemas.schemas import ReferralCreate, ReferralResponse

router = APIRouter()

def generate_referral_number(db: Session) -> str:
    year = datetime.utcnow().strftime("%Y")
    for _ in range(10):
        rand_num = random.randint(10000, 99999)
        ref_num = f"REF-{year}-{rand_num}"
        if not db.query(Referral).filter(Referral.referral_number == ref_num).first():
            return ref_num
    return f"REF-{year}-{int(datetime.utcnow().timestamp())}"

@router.post("", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
def create_referral(
    ref_in: ReferralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    patient = db.query(Patient).filter(Patient.id == ref_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    enc = db.query(Encounter).filter(Encounter.id == ref_in.encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    triage = db.query(TriageRecord).filter(TriageRecord.encounter_id == ref_in.encounter_id).first()

    ref_num = generate_referral_number(db)
    
    # Store clean JSON pointer in QR code payload
    qr_data = f"SWASTHYASETU:REF:{ref_num}:PATIENT:{patient.patient_id}:ENC:{enc.id}"

    referral = Referral(
        referral_number=ref_num,
        patient_id=ref_in.patient_id,
        encounter_id=ref_in.encounter_id,
        triage_record_id=triage.id if triage else None,
        referring_user_id=current_user.id,
        destination_hospital_id=ref_in.destination_hospital_id,
        destination_department=ref_in.destination_department,
        referral_reason=ref_in.referral_reason,
        urgency=ref_in.urgency,
        referral_notes=ref_in.referral_notes,
        qr_code_data=qr_data,
        status=ReferralStatus.PENDING.value
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)

    audit = AuditLog(user_id=current_user.id, action="CREATE_REFERRAL", entity="Referral", entity_id=referral.id)
    db.add(audit)
    db.commit()

    return referral

@router.get("", response_model=List[ReferralResponse])
def list_referrals(
    status_filter: Optional[str] = None,
    urgency_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Referral)
    if status_filter:
        q = q.filter(Referral.status == status_filter)
    if urgency_filter:
        q = q.filter(Referral.urgency == urgency_filter)
    return q.order_by(Referral.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=ReferralResponse)
def get_referral_by_id(id: str, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    ref = db.query(Referral).filter(Referral.id == id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")
    return ref

@router.patch("/{id}/status", response_model=ReferralResponse)
def update_referral_status(
    id: str,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    ref = db.query(Referral).filter(Referral.id == id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")

    ref.status = new_status
    db.commit()
    db.refresh(ref)
    return ref

@router.get("/{id}/qr")
def get_referral_qr_data(id: str, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    ref = db.query(Referral).filter(Referral.id == id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")
    return {
        "referral_number": ref.referral_number,
        "qr_code_data": ref.qr_code_data
    }
