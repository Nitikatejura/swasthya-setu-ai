from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.api.deps import get_current_active_user
from app.ai.manager import ai_manager
from app.schemas.schemas import AIChatRequest

router = APIRouter()

class ExplainTriageRequest(BaseModel):
    priority: str
    matched_rules: List[Dict[str, Any]] = []
    vitals: Dict[str, Any] = {}
    language: str = "gu"

@router.post("/chat")
async def ai_chat(data: AIChatRequest, current_user = Depends(get_current_active_user)):
    res = await ai_manager.chat(data.messages, data.language)
    return res

@router.post("/extract")
async def extract_symptoms(conversation_text: str, language: str = "gu", current_user = Depends(get_current_active_user)):
    res = await ai_manager.extract_symptoms_and_summary(conversation_text, language)
    return res

@router.post("/explain-triage")
def explain_triage(data: ExplainTriageRequest, current_user = Depends(get_current_active_user)):
    explanation = ai_manager.explain_triage_decision(data.priority, data.matched_rules, data.vitals, data.language)
    return {"explanation": explanation}
