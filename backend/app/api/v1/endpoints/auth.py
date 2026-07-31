from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.security import verify_password, create_access_token, create_refresh_token, get_password_hash, decode_token
from app.models.models import User, AuditLog
from app.schemas.schemas import Token, LoginRequest, PasswordChangeRequest, UserResponse, UserCreate

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == login_data.username_or_email) | (User.email == login_data.username_or_email)
    ).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
    
    if user.account_status == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="PENDING: Your registration request has been submitted and is awaiting administrator approval."
        )

    if user.account_status == "REJECTED":
        reason_msg = user.rejected_reason or "Registration request rejected. Please contact administrator."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"REJECTED: {reason_msg}"
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive account")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Record Audit Log
    audit = AuditLog(user_id=user.id, action="USER_LOGIN", entity="User", entity_id=user.id)
    db.add(audit)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    if not user_in.password or not user_in.password.strip():
        raise HTTPException(status_code=400, detail="Password is required")

    reg_num = (user_in.registration_number or "").strip()
    if user_in.role == "Doctor":
        if not reg_num or reg_num.upper() in ["NA", "N/A"]:
            raise HTTPException(status_code=400, detail="Medical Registration Number is required for Doctors")
    else:
        reg_num = "NA"

    new_user = User(
        full_name=user_in.full_name,
        username=user_in.username,
        email=user_in.email,
        phone_number=user_in.phone_number,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        hospital_id=user_in.hospital_id,
        hospital_name=user_in.hospital_name,
        registration_number=reg_num,
        employee_id=user_in.employee_id,
        account_status="PENDING",
        is_active=True,
        requires_password_change=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit = AuditLog(user_id=new_user.id, action="USER_SELF_REGISTER", entity="User", entity_id=new_user.id)
    db.add(audit)
    db.commit()

    access_token = create_access_token(new_user.id)
    refresh_token = create_refresh_token(new_user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/refresh")
def refresh_token(refresh_token_str: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token_str)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User unavailable or inactive")
    
    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    audit = AuditLog(user_id=current_user.id, action="USER_LOGOUT", entity="User", entity_id=current_user.id)
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/change-password")
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.password_hash = get_password_hash(data.new_password)
    current_user.requires_password_change = False
    db.commit()
    return {"message": "Password changed successfully"}
