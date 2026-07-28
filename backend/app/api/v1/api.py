from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, hospitals_villages, patients, encounters,
    symptoms_vitals, ai, triage, doctor, referrals, sync, reports, export, ws
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(hospitals_villages.router, prefix="/geo", tags=["geo"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(encounters.router, prefix="/encounters", tags=["encounters"])
api_router.include_router(symptoms_vitals.router, prefix="/assessment", tags=["assessment"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(triage.router, prefix="/triage", tags=["triage"])
api_router.include_router(doctor.router, prefix="/doctor", tags=["doctor"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(ws.router, tags=["websockets"])
