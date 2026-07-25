from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_worker
from app.models.models import Encounter, Patient, Symptom, Vital, User
from app.schemas.schemas import EncounterCreate, EncounterResponse

router = APIRouter()

@router.post("", response_model=EncounterResponse, status_code=status.HTTP_201_CREATED)
def create_encounter(
    encounter_in: EncounterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    patient = db.query(Patient).filter(Patient.id == encounter_in.patient_id, Patient.is_deleted == False).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    encounter = Encounter(
        patient_id=encounter_in.patient_id,
        healthcare_worker_id=current_user.id,
        notes=encounter_in.notes
    )
    db.add(encounter)
    db.commit()
    db.refresh(encounter)

    # Attach symptoms if provided
    for s_in in encounter_in.symptoms:
        symptom = Symptom(
            encounter_id=encounter.id,
            chief_complaint=s_in.chief_complaint,
            symptom_name=s_in.symptom_name,
            duration=s_in.duration,
            severity=s_in.severity,
            additional_notes=s_in.additional_notes
        )
        db.add(symptom)

    # Attach vitals if provided
    if encounter_in.vitals:
        v_in = encounter_in.vitals
        bmi_val = None
        if v_in.height and v_in.weight and v_in.height > 0:
            height_m = v_in.height / 100.0
            bmi_val = round(v_in.weight / (height_m * height_m), 2)
            
        vital = Vital(
            encounter_id=encounter.id,
            temperature=v_in.temperature,
            pulse_rate=v_in.pulse_rate,
            systolic_bp=v_in.systolic_bp,
            diastolic_bp=v_in.diastolic_bp,
            respiratory_rate=v_in.respiratory_rate,
            spo2=v_in.spo2,
            blood_sugar=v_in.blood_sugar,
            height=v_in.height,
            weight=v_in.weight,
            bmi=bmi_val
        )
        db.add(vital)

    db.commit()
    db.refresh(encounter)
    return encounter

@router.get("/{id}", response_model=EncounterResponse)
def get_encounter_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    encounter = db.query(Encounter).filter(Encounter.id == id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return encounter

@router.get("/patient/{patient_id}", response_model=List[EncounterResponse])
def get_encounters_by_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Encounter).filter(Encounter.patient_id == patient_id).order_by(Encounter.visit_date.desc()).all()
