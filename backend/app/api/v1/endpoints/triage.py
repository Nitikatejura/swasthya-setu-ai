import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_worker
from app.models.models import Encounter, Vital, Symptom, TriageRecord, Notification, User, UserRole, TriagePriority
from app.schemas.schemas import TriageEvaluateRequest, TriageRecordResponse
from app.triage.engine import ClinicalRuleEvaluator

router = APIRouter()

@router.post("/evaluate", response_model=TriageRecordResponse)
def evaluate_triage(
    req: TriageEvaluateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    enc = db.query(Encounter).filter(Encounter.id == req.encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    vitals = db.query(Vital).filter(Vital.encounter_id == req.encounter_id).first()
    symptoms = db.query(Symptom).filter(Symptom.encounter_id == req.encounter_id).all()

    vitals_dict = {}
    if vitals:
        vitals_dict = {
            "temperature": vitals.temperature,
            "pulse_rate": vitals.pulse_rate,
            "systolic_bp": vitals.systolic_bp,
            "diastolic_bp": vitals.diastolic_bp,
            "respiratory_rate": vitals.respiratory_rate,
            "spo2": vitals.spo2,
            "blood_sugar": vitals.blood_sugar,
            "bmi": vitals.bmi
        }

    symptoms_list = [
        {
            "chief_complaint": s.chief_complaint,
            "symptom_name": s.symptom_name,
            "severity": s.severity,
            "duration": s.duration
        } for s in symptoms
    ]

    chief_complaint = symptoms[0].chief_complaint if symptoms else ""

    result = ClinicalRuleEvaluator.evaluate(
        vitals=vitals_dict,
        symptoms=symptoms_list,
        chief_complaint=chief_complaint,
        guideline=req.guideline
    )

    # Save or update TriageRecord
    triage_rec = db.query(TriageRecord).filter(TriageRecord.encounter_id == req.encounter_id).first()
    if not triage_rec:
        triage_rec = TriageRecord(
            encounter_id=req.encounter_id,
            priority=result["priority"],
            matched_rules=json.dumps(result["matched_rules"]),
            clinical_reason=result["clinical_reason"],
            recommended_actions=result["recommended_actions"],
            guideline_used=result["guideline_used"]
        )
        db.add(triage_rec)
    else:
        triage_rec.priority = result["priority"]
        triage_rec.matched_rules = json.dumps(result["matched_rules"])
        triage_rec.clinical_reason = result["clinical_reason"]
        triage_rec.recommended_actions = result["recommended_actions"]
        triage_rec.guideline_used = result["guideline_used"]

    db.commit()
    db.refresh(triage_rec)

    # If priority is RED, trigger emergency doctor notification and WebSocket broadcast
    if result["priority"] == TriagePriority.RED.value:
        doctors = db.query(User).filter(User.role == UserRole.DOCTOR.value, User.is_active == True).all()
        for doc in doctors:
            notif = Notification(
                user_id=doc.id,
                title="🔴 EMERGENCY RED ALERT: High Risk Patient Triage",
                message=f"Patient {enc.patient.full_name} ({enc.patient.patient_id}) flagged as RED priority. Reason: {result['clinical_reason']}",
                priority="HIGH",
                metadata_json=json.dumps({"encounter_id": enc.id, "patient_id": enc.patient_id})
            )
            db.add(notif)
        db.commit()

        # Broadcast real-time RED alert payload to Doctor WebSockets
        alert_payload = {
            "type": "RED_ALERT",
            "alert_id": triage_rec.id,
            "encounter_id": enc.id,
            "patient_id": enc.patient.patient_id,
            "patient_db_id": enc.patient.id,
            "patient_name": enc.patient.full_name,
            "age": enc.patient.age,
            "gender": enc.patient.gender,
            "village": enc.patient.village.name if enc.patient.village else "N/A",
            "spo2": vitals_dict.get("spo2"),
            "systolic_bp": vitals_dict.get("systolic_bp"),
            "diastolic_bp": vitals_dict.get("diastolic_bp"),
            "clinical_reason": result["clinical_reason"],
            "evaluated_at": str(triage_rec.evaluated_at),
            "worker_name": current_user.full_name
        }

        try:
            import asyncio
            from app.core.ws_manager import ws_manager
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(ws_manager.broadcast_to_all_doctors(alert_payload))
            except RuntimeError:
                asyncio.run(ws_manager.broadcast_to_all_doctors(alert_payload))
        except Exception as e:
            pass

    return triage_rec

@router.get("/{encounter_id}", response_model=TriageRecordResponse)
def get_triage_by_encounter(encounter_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    rec = db.query(TriageRecord).filter(TriageRecord.encounter_id == encounter_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Triage record not found")
    return rec
