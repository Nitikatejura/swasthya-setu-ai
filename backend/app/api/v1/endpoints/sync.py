from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.models import Patient, Encounter, Symptom, Vital, TriageRecord, Referral, User, AuditLog
from app.schemas.schemas import SyncUploadRequest, SyncDownloadResponse, ConflictResolutionRequest

router = APIRouter()

@router.post("/upload")
def sync_upload_batch(
    payload: SyncUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    processed = []
    failed = []

    for item in payload.items:
        try:
            entity_type = item.entity_type
            operation = item.operation
            data = item.payload

            if entity_type == "Patient":
                if operation == "CREATE":
                    pid = data.get("patient_id") or f"SS-{datetime.utcnow().year}-{data.get('id')[:4]}"
                    p = Patient(
                        id=item.entity_id,
                        patient_id=pid,
                        full_name=data.get("full_name"),
                        age=data.get("age"),
                        gender=data.get("gender"),
                        phone_number=data.get("phone_number"),
                        village_id=data.get("village_id"),
                        pregnancy_status=data.get("pregnancy_status"),
                        created_by=current_user.id
                    )
                    db.merge(p)
                elif operation == "UPDATE":
                    p = db.query(Patient).filter(Patient.id == item.entity_id).first()
                    if p:
                        for k, v in data.items():
                            if hasattr(p, k) and k not in ["id", "patient_id", "created_by"]:
                                setattr(p, k, v)

            elif entity_type == "Encounter":
                e = Encounter(
                    id=item.entity_id,
                    patient_id=data.get("patient_id"),
                    healthcare_worker_id=current_user.id,
                    notes=data.get("notes")
                )
                db.merge(e)

            elif entity_type == "Vital":
                v = Vital(
                    id=item.entity_id,
                    encounter_id=data.get("encounter_id"),
                    temperature=data.get("temperature"),
                    pulse_rate=data.get("pulse_rate"),
                    systolic_bp=data.get("systolic_bp"),
                    diastolic_bp=data.get("diastolic_bp"),
                    respiratory_rate=data.get("respiratory_rate"),
                    spo2=data.get("spo2"),
                    blood_sugar=data.get("blood_sugar"),
                    bmi=data.get("bmi")
                )
                db.merge(v)

            elif entity_type == "Symptom":
                s = Symptom(
                    id=item.entity_id,
                    encounter_id=data.get("encounter_id"),
                    chief_complaint=data.get("chief_complaint", "Symptom"),
                    symptom_name=data.get("symptom_name", "Symptom"),
                    duration=data.get("duration"),
                    severity=data.get("severity")
                )
                db.merge(s)

            db.commit()
            processed.append(item.queue_id)
        except Exception as e:
            db.rollback()
            failed.append({"queue_id": item.queue_id, "error": str(e)})

    audit = AuditLog(
        user_id=current_user.id,
        action="SYNC_UPLOAD",
        entity="SyncQueue",
        entity_id=f"Processed:{len(processed)}_Failed:{len(failed)}"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "processed_queue_ids": processed,
        "failed": failed,
        "server_timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/download", response_model=SyncDownloadResponse)
def sync_download_updates(
    since: float = 0.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    patients = db.query(Patient).filter(Patient.is_deleted == False).order_by(Patient.updated_at.desc()).limit(200).all()
    encounters = db.query(Encounter).order_by(Encounter.visit_date.desc()).limit(200).all()
    referrals = db.query(Referral).order_by(Referral.created_at.desc()).limit(200).all()

    return {
        "patients": patients,
        "encounters": encounters,
        "referrals": referrals,
        "server_timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.post("/conflict")
def resolve_conflict(
    req: ConflictResolutionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if req.resolution_choice == "KEEP_LOCAL" and req.merged_payload:
        if req.entity_type == "Patient":
            p = db.query(Patient).filter(Patient.id == req.entity_id).first()
            if p:
                for k, v in req.merged_payload.items():
                    if hasattr(p, k) and k not in ["id", "patient_id"]:
                        setattr(p, k, v)
                db.commit()
    return {"message": f"Conflict for {req.entity_type} {req.entity_id} resolved with choice {req.resolution_choice}"}

@router.get("/status")
def sync_status(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    return {
        "status": "online",
        "server_time": datetime.utcnow().isoformat() + "Z"
    }
