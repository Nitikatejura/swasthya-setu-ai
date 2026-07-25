from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user
from app.ai.manager import ai_manager
from app.schemas.schemas import AIChatRequest

router = APIRouter()

@router.post("/chat")
async def ai_chat(data: AIChatRequest, current_user = Depends(get_current_active_user)):
    res = await ai_manager.chat(data.messages, data.language)
    return res

@router.post("/extract")
async def extract_symptoms(conversation_text: str, language: str = "English", current_user = Depends(get_current_active_user)):
    res = await ai_manager.extract_symptoms_and_summary(conversation_text, language)
    return res
