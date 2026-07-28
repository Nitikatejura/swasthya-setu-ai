from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin, get_current_active_user
from app.core.security import get_password_hash
from app.models.models import User, UserRole, AuditLog
from app.schemas.schemas import UserCreate, UserUpdate, UserResponse, ApprovalDecisionRequest, UserProfileUpdate

router = APIRouter()

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    new_user = User(
        full_name=user_in.full_name,
        username=user_in.username,
        email=user_in.email,
        phone_number=user_in.phone_number,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        hospital_id=user_in.hospital_id,
        requires_password_change=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit = AuditLog(
        user_id=admin_user.id,
        action="CREATE_USER",
        entity="User",
        entity_id=new_user.id
    )
    db.add(audit)
    db.commit()

    return new_user

@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return db.query(User).offset(skip).limit(limit).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.phone_number is not None:
        user.phone_number = user_in.phone_number
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.hospital_id is not None:
        user.hospital_id = user_in.hospital_id
    if user_in.is_active is not None:
        user.is_active = user_in.is_active

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/pending/list", response_model=List[UserResponse])
def list_pending_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return db.query(User).filter(User.account_status == "PENDING").all()

@router.put("/{user_id}/approval", response_model=UserResponse)
def approve_or_reject_user(
    user_id: str,
    decision: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if decision.status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be APPROVED or REJECTED")

    if decision.status == "REJECTED" and not decision.rejected_reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required when rejecting an application")

    user.account_status = decision.status
    if decision.status == "APPROVED":
        user.approved_by = admin_user.id
        user.approved_at = datetime.utcnow()
        user.is_active = True
        user.rejected_reason = None
    else:
        user.rejected_reason = decision.rejected_reason
        user.is_active = False

    audit = AuditLog(
        user_id=admin_user.id,
        action=f"USER_{decision.status}",
        entity="User",
        entity_id=user.id
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return user

@router.put("/me/profile", response_model=UserResponse)
def update_current_user_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.phone_number is not None:
        current_user.phone_number = profile_in.phone_number
    if profile_in.hospital_name is not None:
        current_user.hospital_name = profile_in.hospital_name
    if profile_in.registration_number is not None:
        current_user.registration_number = profile_in.registration_number
    if profile_in.employee_id is not None:
        current_user.employee_id = profile_in.employee_id

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_PROFILE",
        entity="User",
        entity_id=current_user.id
    )
    db.add(audit)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    default_pass = "swasthya123"
    user.password_hash = get_password_hash(default_pass)
    user.requires_password_change = True
    db.commit()

    audit = AuditLog(user_id=admin_user.id, action="RESET_USER_PASSWORD", entity="User", entity_id=user.id)
    db.add(audit)
    db.commit()

    return {"message": f"Password for {user.username} has been reset to '{default_pass}'."}
