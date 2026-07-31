from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.models import Patient, Encounter, Symptom, Vital, TriageRecord, Referral, User, AuditLog, Village
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
            data = item.payload or {}

            if entity_type == "Patient":
                if operation == "CREATE" or operation == "UPDATE":
                    pid = data.get("patient_id") or f"SS-{datetime.utcnow().year}-{item.entity_id[:4]}"
                    v_id = data.get("village_id")
                    if v_id and not db.query(Village).filter(Village.id == v_id).first():
                        v_id = None

                    raw_age = data.get("age")
                    parsed_age = int(raw_age) if raw_age is not None and str(raw_age).isdigit() else 30

                    p = Patient(
                        id=item.entity_id,
                        patient_id=pid,
                        full_name=data.get("full_name", "Patient"),
                        age=parsed_age,
                        gender=data.get("gender", "Female"),
                        phone_number=data.get("phone_number"),
                        emergency_contact=data.get("emergency_contact"),
                        blood_group=data.get("blood_group", "Unknown"),
                        village_id=v_id,
                        address=data.get("address"),
                        weight=float(data["weight"]) if data.get("weight") is not None else None,
                        height=float(data["height"]) if data.get("height") is not None else None,
                        allergies=data.get("allergies"),
                        medical_history=data.get("medical_history"),
                        pregnancy_status=data.get("pregnancy_status"),
                        created_by=current_user.id
                    )
                    db.merge(p)

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
                    temperature=float(data["temperature"]) if data.get("temperature") is not None else None,
                    temperature_unit=data.get("temperature_unit", "F"),
                    pulse_rate=int(data["pulse_rate"]) if data.get("pulse_rate") is not None else None,
                    systolic_bp=int(data["systolic_bp"]) if data.get("systolic_bp") is not None else None,
                    diastolic_bp=int(data["diastolic_bp"]) if data.get("diastolic_bp") is not None else None,
                    respiratory_rate=int(data["respiratory_rate"]) if data.get("respiratory_rate") is not None else None,
                    spo2=float(data["spo2"]) if data.get("spo2") is not None else None,
                    blood_sugar=float(data["blood_sugar"]) if data.get("blood_sugar") is not None else None,
                    height=float(data["height"]) if data.get("height") is not None else None,
                    weight=float(data["weight"]) if data.get("weight") is not None else None,
                    bmi=float(data["bmi"]) if data.get("bmi") is not None else None
                )
                db.merge(v)

            elif entity_type == "Symptom":
                s = Symptom(
                    id=item.entity_id,
                    encounter_id=data.get("encounter_id"),
                    chief_complaint=data.get("chief_complaint", "Symptom Consultation"),
                    symptom_name=data.get("symptom_name", "Symptom Consultation"),
                    duration=data.get("duration"),
                    severity=data.get("severity")
                )
                db.merge(s)

            elif entity_type == "TriageRecord":
                tr = TriageRecord(
                    id=item.entity_id,
                    encounter_id=data.get("encounter_id"),
                    priority=data.get("priority", "GREEN"),
                    matched_rules=str(data.get("matched_rules", "[]")),
                    clinical_reason=data.get("clinical_reason", "Triage evaluated offline"),
                    recommended_actions=data.get("recommended_actions", "Routine Care"),
                    guideline_used=data.get("guideline_used", "india_nhm")
                )
                db.merge(tr)

            elif entity_type == "Referral":
                ref_num = data.get("referral_number") or f"REF-{datetime.utcnow().year}-{item.entity_id[:4]}"
                ref = Referral(
                    id=item.entity_id,
                    referral_number=ref_num,
                    patient_id=data.get("patient_id"),
                    encounter_id=data.get("encounter_id"),
                    referring_user_id=current_user.id,
                    destination_department=data.get("destination_department"),
                    referral_reason=data.get("referral_reason", "Emergency Referral"),
                    urgency=data.get("urgency", "High"),
                    status=data.get("status", "Pending"),
                    qr_code_data=data.get("qr_code_data")
                )
                db.merge(ref)

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
