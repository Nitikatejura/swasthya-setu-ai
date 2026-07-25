from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_worker
from app.models.models import Symptom, Vital, Encounter, User
from app.schemas.schemas import SymptomCreate, SymptomResponse, VitalCreate, VitalResponse

router = APIRouter()

@router.post("/symptoms", response_model=SymptomResponse)
def add_symptom(
    encounter_id: str,
    s_in: SymptomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    symptom = Symptom(
        encounter_id=encounter_id,
        chief_complaint=s_in.chief_complaint,
        symptom_name=s_in.symptom_name,
        duration=s_in.duration,
        severity=s_in.severity,
        additional_notes=s_in.additional_notes
    )
    db.add(symptom)
    db.commit()
    db.refresh(symptom)
    return symptom

@router.get("/symptoms/{encounter_id}", response_model=List[SymptomResponse])
def get_symptoms(encounter_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    return db.query(Symptom).filter(Symptom.encounter_id == encounter_id).all()

@router.post("/vitals", response_model=VitalResponse)
def add_vitals(
    encounter_id: str,
    v_in: VitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    enc = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    bmi_val = None
    if v_in.height and v_in.weight and v_in.height > 0:
        height_m = v_in.height / 100.0
        bmi_val = round(v_in.weight / (height_m * height_m), 2)

    vital = Vital(
        encounter_id=encounter_id,
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
    db.refresh(vital)
    return vital

@router.get("/vitals/{encounter_id}", response_model=List[VitalResponse])
def get_vitals(encounter_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    return db.query(Vital).filter(Vital.encounter_id == encounter_id).all()
