from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_admin
from app.models.models import Hospital, Village
from app.schemas.schemas import HospitalCreate, HospitalResponse, VillageCreate, VillageResponse

router = APIRouter()

@router.get("/hospitals", response_model=List[HospitalResponse])
def get_hospitals(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    return db.query(Hospital).all()

@router.post("/hospitals", response_model=HospitalResponse)
def create_hospital(hospital_in: HospitalCreate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    h = Hospital(**hospital_in.model_dump())
    db.add(h)
    db.commit()
    db.refresh(h)
    return h

@router.get("/villages", response_model=List[VillageResponse])
def get_villages(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    return db.query(Village).all()

@router.post("/villages", response_model=VillageResponse)
def create_village(village_in: VillageCreate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    v = Village(**village_in.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v
