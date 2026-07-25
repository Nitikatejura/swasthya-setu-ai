from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin, get_current_active_user
from app.models.models import Patient, Encounter, TriageRecord, Referral, User, Village, AuditLog

router = APIRouter()

@router.get("/dashboard/admin")
def get_admin_dashboard_metrics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    total_patients = db.query(Patient).filter(Patient.is_deleted == False).count()
    total_encounters = db.query(Encounter).count()
    total_referrals = db.query(Referral).count()
    total_users = db.query(User).count()

    # Triage breakdown
    red_count = db.query(TriageRecord).filter(TriageRecord.priority == "RED").count()
    yellow_count = db.query(TriageRecord).filter(TriageRecord.priority == "YELLOW").count()
    green_count = db.query(TriageRecord).filter(TriageRecord.priority == "GREEN").count()

    # Village distribution
    villages = db.query(Village).all()
    village_stats = []
    for v in villages:
        count = db.query(Patient).filter(Patient.village_id == v.id, Patient.is_deleted == False).count()
        village_stats.append({"name": v.name, "patient_count": count})

    # Recent Audit Logs
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(20).all()
    audit_trail = [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity": l.entity,
            "timestamp": l.timestamp
        } for l in logs
    ]

    return {
        "metrics": {
            "total_patients": total_patients,
            "total_encounters": total_encounters,
            "total_referrals": total_referrals,
            "total_users": total_users
        },
        "triage_distribution": {
            "red": red_count,
            "yellow": yellow_count,
            "green": green_count
        },
        "village_stats": village_stats,
        "recent_audit_logs": audit_trail
    }

@router.get("/summary")
def get_reports_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    total_patients = db.query(Patient).filter(Patient.is_deleted == False).count()
    total_encounters = db.query(Encounter).count()
    total_referrals = db.query(Referral).count()
    red_cases = db.query(TriageRecord).filter(TriageRecord.priority == "RED").count()
    yellow_cases = db.query(TriageRecord).filter(TriageRecord.priority == "YELLOW").count()
    green_cases = db.query(TriageRecord).filter(TriageRecord.priority == "GREEN").count()

    return {
        "period": "All Time",
        "total_patients": total_patients,
        "total_encounters": total_encounters,
        "total_referrals": total_referrals,
        "triage": {
            "RED": red_cases,
            "YELLOW": yellow_cases,
            "GREEN": green_cases
        }
    }
