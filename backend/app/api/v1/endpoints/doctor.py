from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_doctor, get_current_active_user
from app.models.models import Encounter, Patient, TriageRecord, DoctorNote, Notification, User, Referral, AuditLog
from app.schemas.schemas import DoctorNoteCreate

router = APIRouter()

class DoctorImpressionRequest(BaseModel):
    doctor_impression: str
    treatment_orders: Optional[str] = None
    clinical_orders: Optional[str] = None
    encounter_id: str

@router.get("/dashboard")
def get_doctor_dashboard_stats(
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_doctor)
):
    total_patients = db.query(Patient).filter(Patient.is_deleted == False).count()
    red_cases = db.query(TriageRecord).filter(TriageRecord.priority == "RED").count()
    yellow_cases = db.query(TriageRecord).filter(TriageRecord.priority == "YELLOW").count()
    green_cases = db.query(TriageRecord).filter(TriageRecord.priority == "GREEN").count()
    pending_referrals = db.query(Referral).filter(Referral.status == "Pending").count()
    reviewed_cases = db.query(Encounter).filter(Encounter.is_reviewed == True).count()

    # Recent Emergency RED list
    red_triages = db.query(TriageRecord).filter(TriageRecord.priority == "RED").order_by(TriageRecord.evaluated_at.desc()).limit(10).all()
    emergency_queue = []
    for tr in red_triages:
        enc = db.query(Encounter).filter(Encounter.id == tr.encounter_id).first()
        if enc and enc.patient:
            emergency_queue.append({
                "triage_id": tr.id,
                "encounter_id": enc.id,
                "patient_id": enc.patient.patient_id,
                "patient_db_id": enc.patient.id,
                "patient_name": enc.patient.full_name,
                "age": enc.patient.age,
                "gender": enc.patient.gender,
                "village": enc.patient.village.name if enc.patient.village else "N/A",
                "clinical_reason": tr.clinical_reason,
                "evaluated_at": tr.evaluated_at.isoformat() if tr.evaluated_at else None,
                "is_acknowledged": tr.is_acknowledged_by_doctor
            })

    return {
        "summary": {
            "total_patients": total_patients,
            "red_cases": red_cases,
            "yellow_cases": yellow_cases,
            "green_cases": green_cases,
            "pending_referrals": pending_referrals,
            "reviewed_cases": reviewed_cases
        },
        "emergency_queue": emergency_queue
    }

@router.get("/alerts")
def get_emergency_alerts(
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_doctor)
):
    unack_reds = db.query(TriageRecord).filter(
        TriageRecord.priority == "RED",
        TriageRecord.is_acknowledged_by_doctor == False
    ).order_by(TriageRecord.evaluated_at.desc()).all()

    alerts = []
    for tr in unack_reds:
        enc = db.query(Encounter).filter(Encounter.id == tr.encounter_id).first()
        if enc and enc.patient:
            alerts.append({
                "alert_id": tr.id,
                "triage_id": tr.id,
                "encounter_id": enc.id,
                "patient_id": enc.patient.patient_id,
                "patient_name": enc.patient.full_name,
                "age": enc.patient.age,
                "gender": enc.patient.gender,
                "clinical_reason": tr.clinical_reason,
                "evaluated_at": tr.evaluated_at.isoformat() if tr.evaluated_at else None
            })
    return alerts

@router.put("/alerts/{triage_id}/acknowledge")
def acknowledge_alert(
    triage_id: str,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_doctor)
):
    tr = db.query(TriageRecord).filter(TriageRecord.id == triage_id).first()
    if not tr:
        tr = db.query(TriageRecord).filter(TriageRecord.encounter_id == triage_id).first()
        if not tr:
            raise HTTPException(status_code=404, detail="Triage record not found")

    tr.is_acknowledged_by_doctor = True
    tr.acknowledged_by = doctor_user.id
    tr.acknowledged_at = datetime.utcnow()
    db.commit()

    audit = AuditLog(user_id=doctor_user.id, action="ACKNOWLEDGE_RED_ALERT", entity="TriageRecord", entity_id=tr.id)
    db.add(audit)
    db.commit()

    return {"message": "Alert acknowledged successfully"}

@router.put("/cases/{encounter_id}/impression")
def save_case_impression(
    encounter_id: str,
    req: DoctorImpressionRequest,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_doctor)
):
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    note = db.query(DoctorNote).filter(DoctorNote.encounter_id == encounter_id).first()
    orders_text = req.clinical_orders or req.treatment_orders
    if not note:
        note = DoctorNote(
            encounter_id=encounter_id,
            doctor_id=doctor_user.id,
            notes=req.doctor_impression,
            diagnosis_impression=req.doctor_impression,
            treatment_plan=req.treatment_orders,
            clinical_orders=orders_text
        )
        db.add(note)
    else:
        note.notes = req.doctor_impression
        note.diagnosis_impression = req.doctor_impression
        note.treatment_plan = req.treatment_orders
        note.clinical_orders = orders_text

    enc.is_reviewed = True
    db.commit()

    audit = AuditLog(user_id=doctor_user.id, action="SAVE_DOCTOR_IMPRESSION", entity="Encounter", entity_id=encounter_id)
    db.add(audit)
    db.commit()

    return {"message": "Doctor impression and treatment plan saved successfully"}

@router.post("/notes")
def add_doctor_notes(
    note_in: DoctorNoteCreate,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_doctor)
):
    enc = db.query(Encounter).filter(Encounter.id == note_in.encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    note = DoctorNote(
        encounter_id=note_in.encounter_id,
        doctor_id=doctor_user.id,
        notes=note_in.notes,
        diagnosis_impression=note_in.diagnosis_impression,
        treatment_plan=note_in.treatment_plan
    )
    db.add(note)
    enc.is_reviewed = True
    db.commit()
    db.refresh(note)
    return note

@router.put("/encounters/{encounter_id}/review")
def mark_encounter_reviewed(
    encounter_id: str,
    db: Session = Depends(get_db),
    doctor_user: User = Depends(require_doctor)
):
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    enc.is_reviewed = True
    db.commit()
    return {"message": "Encounter marked as reviewed"}
