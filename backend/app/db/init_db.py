from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.models import User, UserRole, Hospital, Village

def init_db(db: Session):
    # 1. Seed Hospital
    h1 = db.query(Hospital).filter(Hospital.code == "HOSP-001").first()
    if not h1:
        h1 = Hospital(
            name="Anand District General Hospital",
            code="HOSP-001",
            district="Anand",
            state="Gujarat"
        )
        db.add(h1)
        db.commit()
        db.refresh(h1)

    # 2. Seed Villages
    v_names = [("Mogri", "Anand"), ("Bakrol", "Anand"), ("Karamsad", "Anand"), ("Vadtal", "Nadiad")]
    for v_name, blk in v_names:
        v = db.query(Village).filter(Village.name == v_name).first()
        if not v:
            v = Village(name=v_name, block=blk, district="Anand", state="Gujarat")
            db.add(v)
    db.commit()

    # 3. Seed Admin User
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            full_name="System Administrator",
            username="admin",
            email="admin@swasthyasetu.org",
            phone_number="+91 98765 00001",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN.value,
            hospital_id=h1.id,
            requires_password_change=False
        )
        db.add(admin)

    # 4. Seed Doctor User
    doctor = db.query(User).filter(User.username == "dr_smith").first()
    if not doctor:
        doctor = User(
            full_name="Dr. Rajesh Patel",
            username="dr_smith",
            email="dr.patel@swasthyasetu.org",
            phone_number="+91 98765 00002",
            password_hash=get_password_hash("doctor123"),
            role=UserRole.DOCTOR.value,
            hospital_id=h1.id,
            requires_password_change=False
        )
        db.add(doctor)

    # 5. Seed Healthcare Worker User
    worker = db.query(User).filter(User.username == "nurse_asha").first()
    if not worker:
        worker = User(
            full_name="Priya Ben (ASHA Worker)",
            username="nurse_asha",
            email="priya.asha@swasthyasetu.org",
            phone_number="+91 98765 00003",
            password_hash=get_password_hash("worker123"),
            role=UserRole.HEALTHCARE_WORKER.value,
            hospital_id=h1.id,
            requires_password_change=False
        )
        db.add(worker)

    db.commit()
