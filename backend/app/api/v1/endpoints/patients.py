import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_worker
from app.models.models import Patient, User, UserRole, AuditLog
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter()

def generate_patient_id(db: Session) -> str:
    year = datetime.utcnow().strftime("%Y")
    for _ in range(10):
        rand_num = random.randint(1000, 9999)
        pid = f"SS-{year}-{rand_num}"
        if not db.query(Patient).filter(Patient.patient_id == pid).first():
            return pid
    return f"SS-{year}-{int(datetime.utcnow().timestamp())}"

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    pid = generate_patient_id(db)
    patient = Patient(
        patient_id=pid,
        full_name=patient_in.full_name,
        age=patient_in.age,
        gender=patient_in.gender,
        date_of_birth=patient_in.date_of_birth,
        phone_number=patient_in.phone_number,
        emergency_contact=patient_in.emergency_contact,
        blood_group=patient_in.blood_group,
        village_id=patient_in.village_id,
        address=patient_in.address,
        weight=patient_in.weight,
        height=patient_in.height,
        allergies=patient_in.allergies,
        medical_history=patient_in.medical_history,
        pregnancy_status=patient_in.pregnancy_status,
        photo_url=patient_in.photo_url,
        created_by=current_user.id
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    audit = AuditLog(user_id=current_user.id, action="CREATE_PATIENT", entity="Patient", entity_id=patient.id)
    db.add(audit)
    db.commit()

    return patient

@router.get("", response_model=List[PatientResponse])
def search_patients(
    query: Optional[str] = Query(None, description="Search by Patient ID, Name, Phone, or Village"),
    village_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Patient).filter(Patient.is_deleted == False)
    
    if village_id:
        q = q.filter(Patient.village_id == village_id)
        
    if query:
        search_term = f"%{query}%"
        q = q.filter(
            (Patient.patient_id.ilike(search_term)) |
            (Patient.full_name.ilike(search_term)) |
            (Patient.phone_number.ilike(search_term))
        )

    patients = q.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
    return patients

@router.get("/{id}", response_model=PatientResponse)
def get_patient_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    patient = db.query(Patient).filter(Patient.id == id, Patient.is_deleted == False).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{id}", response_model=PatientResponse)
def update_patient(
    id: str,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    patient = db.query(Patient).filter(Patient.id == id, Patient.is_deleted == False).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    for field, value in patient_in.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{id}")
def soft_delete_patient(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.is_deleted = True
    db.commit()

    audit = AuditLog(user_id=current_user.id, action="SOFT_DELETE_PATIENT", entity="Patient", entity_id=id)
    db.add(audit)
    db.commit()

    return {"message": "Patient soft deleted successfully"}
